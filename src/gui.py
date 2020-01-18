import kivy

from kivy.config import Config
Config.set('input', 'mouse', 'mouse,multitouch_on_demand')

from kivy.app import App
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
#pdb.set_trace()

class dancePartLayout(GridLayout):
    def __init__(self, segments, **kwargs):
        super(dancePartLayout, self).__init__(**kwargs)
        self.rows = len(segments)
        for i in range(0,self.rows):

            self.add_widget(Label(text=segments[i].description))
            CB = CheckBox()
            CB.id = 'chk_{}'.format(i)
            self.add_widget(CB)
            CB.bind(active=on_checkbox_active)

class parts_n_playLayout(BoxLayout):
    def __init__(self, segments, **kwargs):
        self.sound = sound
        super(parts_n_playLayout, self).__init__(**kwargs)
        self.orientation = 'vertical'
        self.id = 'player'
        self.add_widget(Label(text = SM.name, size_hint = (1.0,0.2)))
        self.add_widget(dancePartLayout(SM.segments))
        PlayButton = Button(text='Play', size_hint=(1.0,.2))
        PlayButton.bind(on_press = self.on_pressed_play)
        self.add_widget(PlayButton)
        self.sound.bind(on_stop = self.on_stopped)

    def on_pressed_play(self, button):
        #pdb.set_trace()
        #global sound
        print("state: " + button.state)
        for i in range(len(playlist)):
            print("state of item {} in playlist : {}".format(i,playlist[i]))
        music = 0
        active_indices = [i for i, e in enumerate(playlist) if e != 0]
        #pdb.set_trace()
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
            self.waveForm = ContainedWaveform.ScrollableSoundVizualizer(music, self.sound)
            self.parent.add_widget(self.waveForm)
            #pdb.set_trace()
            self.sound.play()
        else:
            button.text = 'play'
            self.sound.stop()
            self.parent.remove_widget(self.waveForm)

    def on_stopped(self, sound):
        #pdb.set_trace()
        self.parent.remove_widget(self.waveForm)
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

    def on_pressed_load(self,button):
        print('Loading..')
        if len(self.filechooser.selection) > 0:
            SM.clearData()
            SM.importData(self.filechooser.selection[0])
        mainApp = App.get_running_app()

        mainScreen = mainApp.root.get_screen('Main Screen')

        widget_to_remove = mainScreen.layout.children[0] #= parts_n_playLayout(SM.segments)
        mainScreen.layout.remove_widget(widget_to_remove)
        mainScreen.layout.add_widget(parts_n_playLayout(SM.segments))

class MacroLayout(BoxLayout):
    def __init__(self, sound, **kwargs):
        super(MacroLayout, self).__init__(**kwargs)
        self.orientation = 'horizontal'
        #self.add_widget(FileChooserLayout())
        self.add_widget(parts_n_playLayout(SM.segments))

class FileChooserScreen(Screen):
    def __init__(self, **kwargs):
        super(FileChooserScreen, self).__init__(**kwargs)
        self.add_widget(FileChooserLayout())

        backButton = Button(text='Back', size_hint=(0.5,0.1))
        backButton.bind(on_press = self.to_back)
        self.add_widget(backButton)

    def to_back(self, button):
        app = App.get_running_app()
        app.root.current = 'Main Screen'

class MainScreen(Screen):
    def __init__(self, sound, **kwargs):
        super(MainScreen, self).__init__(**kwargs)
        self.layout = MacroLayout(sound)
        self.add_widget(self.layout)

        loaderButton = Button(text='Settings', size_hint=(0.5,0.1))
        loaderButton.bind(on_press = self.to_loading)
        self.add_widget(loaderButton)

    def to_loading(self, button):
        app = App.get_running_app()
        app.root.current = 'Load audio metadata'

class ChoreographyCreator(App):

    def build(self):
        self.sound = sound
        self.sm = ScreenManager()
        self.sm.add_widget(MainScreen(self.sound,name='Main Screen'))
        self.sm.add_widget(FileChooserScreen(name='Load audio metadata'))
        return self.sm
        #return MacroLayout(self.sound)#mainLayout(13)

def on_checkbox_active(checkbox, value):
    index = int(checkbox.id.strip('chk_'))
    print(index)
    print('playlist size: {}'.format(len(playlist)))
    if value:
        print('The checkbox', checkbox.id, 'is active')
        playlist[index] = 1
    else:
        print('The checkbox', checkbox.id, 'is inactive')
        playlist[index] = 0

"""def on_pressed_play(button):

    global sound
    print("state: " + button.state)
    for i in range(len(playlist)):
        print("state of item {} in playlist : {}".format(i,playlist[i]))
    music = 0
    active_indices = [i for i, e in enumerate(playlist) if e != 0]
    #pdb.set_trace()
    if sound.state == 'stop' and len(active_indices) > 0:

        for i in active_indices:
            start = SM.segments[i].start
            end = SM.segments[i].end
            music = music + mp3_version[start:end]
        filePath = "../audio/intermed.mp3"
        if os.path.exists(filePath):
            os.remove(filePath)
        thefile = music.export(filePath, format="mp3")
        thefile.seek(0)
        sound = SoundLoader.load(thefile.name)
        button.text = 'stop'
        sound.play()
    else:
        button.text = 'play'
        sound.stop()"""

    #pydub.playback._play_with_pyaudio(music)


if __name__ == '__main__':
    ChoreographyCreator().run()
