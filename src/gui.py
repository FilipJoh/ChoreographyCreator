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

mp3_version = AudioSegment.from_mp3("../audio/08 Rasputin.mp3")
sound = SoundLoader.load("../audio/08 Rasputin.mp3")
SM = segmentModel.songMetadata('ahuba')
SM.importData('Rasputin.xml')
playlist = [0] * len(SM.segments)

class dancePartLayout(GridLayout):
    def __init__(self, segments, **kwargs):
        super(dancePartLayout, self).__init__(**kwargs)
        self.rows = len(segments)
        for i in range(0,self.rows):

            self.add_widget(Label(text=segments[i].description))
            CB = CheckBox()
            CB.id = 'chk_{}'.format(i)
            self.add_widget(CB)
            CB.bind(active=self.on_checkbox_active)

    def on_checkbox_active(self, checkbox, value):
        global playlist
        index = int(checkbox.id.strip('chk_'))
        print(index)
        print('playlist size: {}'.format(len(playlist)))
        if value:
            print('The checkbox', checkbox.id, 'is active')
            playlist[index] = 1
        else:
            print('The checkbox', checkbox.id, 'is inactive')
            playlist[index] = 0

class parts_n_playLayout(BoxLayout):
    def __init__(self, **kwargs):
        self.sound = sound
        super(parts_n_playLayout, self).__init__(**kwargs)
        self.orientation = 'vertical'
        self.id = 'player'
        self.add_widget(Label(text = SM.name, size_hint = (1.0,0.2)))
        self.add_widget(dancePartLayout(SM.segments))
        self.PlayButton = Button(text='Play', size_hint=(1.0,.2))
        self.PlayButton.bind(on_press = self.on_pressed_play)
        self.add_widget(self.PlayButton)
        self.sound.bind(on_stop = self.on_stopped)

    def on_pressed_play(self, button):
        print("state: " + button.state)
        for i in range(len(playlist)):
            print("state of item {} in playlist : {}".format(i,playlist[i]))
        music = 0
        active_indices = [i for i, e in enumerate(playlist) if e != 0]
        if self.sound.state == 'stop' and len(active_indices) > 0:

            for i in active_indices:
                start = SM.segments[i].start
                end = SM.segments[i].end
                music = music + mp3_version[start:end]
            filePath = "../audio/intermed.mp3"
            if os.path.exists(filePath):
                os.remove(filePath)
            thefile = music.export(filePath, format="mp3")
            thefile.seek(0)
            self.sound = SoundLoader.load(thefile.name) # redefinied need new bind
            self.sound.bind(on_stop = self.on_stopped)
            button.text = 'stop'
            app = App.get_running_app()
            app.sm.add_widget(PlaybackScreen(music, self.sound, name ='player'))
            app.root.current = 'player'
            self.sound.play()
        else:
            button.text = 'play'
            self.sound.stop()
            app = App.get_running_app()
            app.root.current = 'DanceSelector'
            app.sm.remove_widget(app.root.get_screen('player'))

    def on_stopped(self, sound):
        app = App.get_running_app()
        app.root.current = 'DanceSelector'
        app.sm.remove_widget(app.root.get_screen('player'))
        self.PlayButton.text = 'play'
        return False

class FileChooserLayout(BoxLayout):
    def __init__(self,**kwargs):
        super(FileChooserLayout, self).__init__(**kwargs)
        self.orientation = 'vertical'
        self.add_widget(Label(text='Chose a file', size_hint=(1.0,0.2)))

        self.filechooser = FileChooserListView()
        self.filechooser.layout.ids.scrollview.scroll_type = ['content', 'bars']
        self.filechooser.layout.ids.scrollview.do_scroll_x = True
        #self.filechooser.layout.ids.scrollview.scroll_y = 3.0
        self.filechooser.layout.ids.scrollview.bar_width = 10.0
        self.filechooser.layout.ids.scrollview.height = 100.0
        self.filechooser.path = 'C:\\Users\\Filip\\Projects\\Choreography-creator\\src'
        self.filechooser.filters = ['*.xml']
        self.add_widget(self.filechooser)
        self.confirmButton = Button(text='Load', size_hint=(1.0,0.2))
        self.confirmButton.bind(on_press = self.on_pressed_load)
        self.add_widget(self.confirmButton)

        backButton = Button(text='Back', size_hint=(1.0,0.1))
        backButton.bind(on_press = self.to_back)
        self.add_widget(backButton)

    def on_pressed_load(self,button):
        print('Loading..')
        if len(self.filechooser.selection) > 0:
            SM.clearData()
            SM.importData(self.filechooser.selection[0])
        mainApp = App.get_running_app()

        #if (mainApp.root.has_screen('DanceSelector')):
        mainScreen = mainApp.root.get_screen('DanceSelector')
        widget_to_remove = mainScreen.layout.parts#getattr(mainScreen.layout.ids, 'playlist')#children[0] #= parts_n_playLayout(SM.segments)
        mainScreen.layout.remove_widget(widget_to_remove)
        mainScreen.layout.parts = parts_n_playLayout()
        mainScreen.layout.add_widget(mainScreen.layout.parts, 1)
        mainApp.root.current = 'DanceSelector'

    def to_back(self, button):
        app = App.get_running_app()
        app.root.current = 'menu'

class MacroLayout(BoxLayout):
    def __init__(self, sound, **kwargs):
        super(MacroLayout, self).__init__(**kwargs)
        self.orientation = 'vertical'
        self.parts = Label(text='nuthin here yet')#parts_n_playLayout(SM.segments,id='playlist')
        self.add_widget(self.parts)
        loaderButton = Button(text='Load a file', size_hint=(1.0,0.07))
        loaderButton.bind(on_press = self.to_loading)
        self.add_widget(loaderButton)

    def to_loading(self, button):
        app = App.get_running_app()
        app.root.current = 'Load audio metadata'

class FileChooserScreen(Screen):
    def __init__(self, **kwargs):
        super(FileChooserScreen, self).__init__(**kwargs)
        self.add_widget(FileChooserLayout())


class PlayerScreen(Screen):
    def __init__(self, sound, **kwargs):
        super(PlayerScreen, self).__init__(**kwargs)
        self.layout = MacroLayout(sound)
        self.add_widget(self.layout)

class PlaybackScreen(Screen):
    def __init__(self, music, sound,**kwargs):
        super(PlaybackScreen, self).__init__(**kwargs)
        self.waveform = ContainedWaveform.ScrollableSoundVizualizer(music, sound)
        self.add_widget(self.waveform)

class MainScreen(Screen):
    pass


class ChoreographyCreator(App):

    def build(self):
        test = Builder.load_file('kvy-files/mainScreen.kv')
        #pdb.set_trace()
        self.sound = sound
        self.sm = ScreenManager()
        self.sm.add_widget(MainScreen(name = 'menu'))
        self.sm.add_widget(PlayerScreen(self.sound,name='DanceSelector'))
        self.sm.add_widget(FileChooserScreen(name='Load audio metadata'))
        return self.sm

if __name__ == '__main__':
    ChoreographyCreator().run()
