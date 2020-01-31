import kivy

from kivy.config import Config
Config.set('input', 'mouse', 'mouse,multitouch_on_demand')

from kivy.app import App
from kivy.lang import Builder
from kivy.uix.gridlayout import GridLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.checkbox import CheckBox
from kivy.uix.button import Button
from kivy.uix.screenmanager import ScreenManager, Screen
from AudioViz import ContainedWaveform
from kivy.uix.filechooser import FileChooserListView
from kivy.core.audio import SoundLoader

import segmentModel
import pdb

import os

from pydub import AudioSegment

class dancePartLayout(GridLayout):
    def __init__(self, segments, **kwargs):
        super(dancePartLayout, self).__init__(**kwargs)
        self.rows = len(segments)
        for i in range(0,self.rows):
            self.add_widget(Label(text=segments[i].description, size_hint=(1.0, 2.0)))
            CB = CheckBox()
            CB.id = 'chk_{}'.format(i)
            self.add_widget(CB)
            CB.bind(active=self.on_checkbox_active)

    def on_checkbox_active(self, checkbox, value):
        playlist = self.parent.parent.parent.playlist
        index = int(checkbox.id.strip('chk_'))
        print(index)
        print('playlist size: {}'.format(len(playlist)))
        if value:
            print('The checkbox', checkbox.id, 'is active')
            playlist[index] = 1
        else:
            print('The checkbox', checkbox.id, 'is inactive')
            playlist[index] = 0

class FileChooserScreen(Screen):
    def __init__(self, **kwargs):
        super(FileChooserScreen, self).__init__(**kwargs)
        self.ids['loader'].layout.ids.scrollview.bar_width = 10.0
        self.ids['loader'].layout.ids.scrollview.height = 100.0
        self.ids['loader'].layout.ids.scrollview.scroll_type = ['content', 'bars']
        self.ids['loader'].path = os.path.join(os.getcwd(),'..','data')

    def on_pressed_load(self):
        print('Loading..')
        mainApp = App.get_running_app()
        if len(self.ids['loader'].selection) > 0:
            mainApp.load_data(self.ids['loader'].selection[0])

        DanceSelector_screen = self.manager.get_screen('DanceSelector')
        DanceSelector_screen.ids['title'].text = mainApp.SegmentModel.name
        scrollview_segments = DanceSelector_screen.ids['scrollViewLayout']
        scrollview_segments.remove_widget(scrollview_segments.children[0])
        scrollview_segments.add_widget(dancePartLayout(mainApp.SegmentModel.segments, size_hint = (1.0, 0.3 * len(mainApp.SegmentModel.segments))))
        DanceSelector_screen.playlist = [0] * len(mainApp.SegmentModel.segments)
        self.manager.current = 'DanceSelector'

    def to_back(self):
        app = App.get_running_app()
        app.root.current = 'menu'


class PlayerScreen(Screen):
    def __init__(self, **kwargs):
        super(PlayerScreen, self).__init__(**kwargs)
        self.layout = MacroLayout()
        self.add_widget(self.layout)

class PlaybackScreen(Screen):
    def __init__(self, music, sound,**kwargs):
        super(PlaybackScreen, self).__init__(**kwargs)
        self.waveform = ContainedWaveform.ScrollableSoundVizualizer(music, sound)
        self.add_widget(self.waveform)

class MainScreen(Screen):
    pass

class SegmentSelectorScreen(Screen):
    def __init__(self, **kwargs):
        super(SegmentSelectorScreen, self).__init__(**kwargs)
        self.playlist = []

    def on_pressed_play(self):
        for i in range(len(self.playlist)):
            print("state of item {} in playlist : {}".format(i,self.playlist[i]))
        music = 0
        active_indices = [i for i, e in enumerate(self.playlist) if e != 0]
        app = App.get_running_app()
        #self.sound = app.sound
        if app.sound.state == 'stop' and len(active_indices) > 0:

            for i in active_indices:
                start = app.SegmentModel.segments[i].start
                end = app.SegmentModel.segments[i].end
                music = music + app.audioSegment[start:end]
            filePath = "../audio/intermed.mp3"
            if os.path.exists(filePath):
                os.remove(filePath)
            thefile = music.export(filePath, format="mp3")
            thefile.seek(0)
            app.sound = SoundLoader.load(thefile.name) # redefinied need new bind
            app.sound.bind(on_stop = self.on_stopped)
            self.ids['playbtn'].text = 'stop'
            app.sm.add_widget(PlaybackScreen(music, app.sound, name ='player'))
            if app.root.has_screen('player'):
                app.root.current = 'player'
            app.sound.play()
        else:
            self.ids['playbtn'].text = 'play'
            app.sound.stop()
            app.root.current = 'DanceSelector'
            if app.root.has_screen('player'):
                app.sm.remove_widget(app.root.get_screen('player'))

    def on_stopped(self, sound):
        app = App.get_running_app()
        app.root.current = 'DanceSelector'
        app.sm.remove_widget(app.root.get_screen('player'))
        self.ids['playbtn'].text = 'play'
        return False

class ChoreographyCreator(App):

    def build(self):
        test = Builder.load_file('kvy-files/mainScreen.kv')
        self.sm = ScreenManager()
        self.sm.add_widget(MainScreen(name = 'menu'))
        self.sm.add_widget(SegmentSelectorScreen(name = 'DanceSelector'))#PlayerScreen(name='DanceSelector'))
        self.sm.add_widget(FileChooserScreen(name='Load audio metadata'))
        return self.sm

    def load_data(self, filePath):
            #self.SegmentModel.clearData()
        self.SegmentModel = segmentModel.songMetadata()
        self.SegmentModel.importData(filePath)
        audioPath = os.path.join(os.path.split(filePath)[0], self.SegmentModel.audioPath)
        self.audioSegment = AudioSegment.from_mp3(audioPath)
        self.sound = SoundLoader.load(audioPath)

if __name__ == '__main__':
    ChoreographyCreator().run()
