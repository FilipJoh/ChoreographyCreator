import kivy

from kivy.config import Config
Config.set('input', 'mouse', 'mouse,multitouch_on_demand')

from kivy.app import App
from kivy.lang import Builder
from kivy.uix.gridlayout import GridLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.checkbox import CheckBox
from kivy.graphics import Color
from kivy.clock import Clock
from kivy.graphics import Rectangle
from kivy.uix.button import Button
from kivy.uix.screenmanager import ScreenManager, Screen
from AudioViz import ContainedWaveform
from kivy.uix.filechooser import FileChooserListView
from kivy.core.audio import SoundLoader
from kivy.uix.widget import Widget
from kivy.properties import NumericProperty, BooleanProperty, ObjectProperty
from kivy.uix.textinput import TextInput
from kivy.core.text import Label as CoreLabel
from kivy.event import EventDispatcher

#from kivy.graphics import Line

import segmentModel
import pdb

import os

from pydub import AudioSegment


class EditableLabel(Label):

    edit = BooleanProperty(False)

    textinput = ObjectProperty(None, allownone=True)

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos) and not self.edit:
            self.edit = True
        return super(EditableLabel, self).on_touch_down(touch)

    def on_edit(self, instance, value):
        if not value:
            if self.textinput:
                self.remove_widget(self.textinput)
            return
        self.textinput = t = TextInput(
                text=self.text, size_hint=(None, None),
                font_size=self.font_size, font_name=self.font_name,
                pos=self.pos, size=self.size, multiline=False)
        self.bind(pos=t.setter('pos'), size=t.setter('size'))
        self.add_widget(self.textinput)
        t.bind(on_text_validate=self.on_text_validate, focus=self.on_text_focus)

    def on_text_validate(self, instance):
        self.text = instance.text
        self.edit = False

    def on_text_focus(self, instance, focus):
        if focus is False:
            self.text = instance.text
            self.edit = False

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

class FileChooserScreen_Choreography(Screen):
    def __init__(self, **kwargs):
        super(FileChooserScreen_Choreography, self).__init__(**kwargs)
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

class FileChooserScreen_Song(Screen):
    def __init__(self, **kwargs):
        super(FileChooserScreen_Song, self).__init__(**kwargs)
        self.ids['loader'].layout.ids.scrollview.bar_width = 10.0
        self.ids['loader'].layout.ids.scrollview.height = 100.0
        self.ids['loader'].layout.ids.scrollview.scroll_type = ['content', 'bars']
        self.ids['loader'].path = os.path.join(os.getcwd(),'..','data')
        self.ids['loader'].files = [file for file in self.ids['loader'].files if file != '*intermed.mp3']

    def on_pressed_load(self):
        print('Loading..')
        mainApp = App.get_running_app()
        if len(self.ids['loader'].selection) > 0:
            mainApp.load_song(self.ids['loader'].selection[0])
            print('{} loaded!'.format(self.ids['loader'].selection[0]))

            if not mainApp.sm.has_screen('SegmentCreate'):
                mainApp.sm.add_widget(SegmentCreatorScreen(name='SegmentCreate'))
                segmentCreatorScreen = mainApp.sm.get_screen('SegmentCreate')
                segmentCreatorScreen.reload_audio()
                segmentCreatorScreen.ids['waveform_holder'].add_widget(ContainedWaveform.ScrollableSoundVizualizer(mainApp.audioSegment, segmentCreatorScreen.sound))
                mainApp.sm.current = 'SegmentCreate'
            else:
                segmentCreatorScreen = mainApp.sm.get_screen('SegmentCreate')
                segmentCreatorScreen.ids['waveform_holder'].remove_widget(segmentCreatorScreen.ids['waveform_holder'].children[0])
                segmentCreatorScreen.reload_audio()
                segmentCreatorScreen.ids['waveform_holder'].add_widget(ContainedWaveform.ScrollableSoundVizualizer(mainApp.audioSegment, segmentCreatorScreen.sound))
                segmentCreatorScreen.song_pos = 0
                mainApp.sm.current = 'SegmentCreate'
        else:
            Print("unable to load!")

    def to_back(self):
        app = App.get_running_app()
        app.root.current = 'menu'

class PlaybackScreen(Screen):
    def __init__(self, music, sound,**kwargs):
        super(PlaybackScreen, self).__init__(**kwargs)
        self.waveform = ContainedWaveform.ScrollableSoundVizualizer(music, sound)
        self.add_widget(self.waveform)
        stopButton = Button(text = "Stop", size_hint = (1.0, 0.2))
        stopButton.bind(on_press = self.stop_playback)
        self.add_widget(stopButton)

    def stop_playback(self, button):
        app = App.get_running_app()
        app.sound.stop()
        app.root.current = 'DanceSelector'

class MainScreen(Screen):

    def select_n_refresh_ChoreoLoader(self):
        app = App.get_running_app()
        danceSelectorScreen = app.sm.get_screen('Load audio metadata')
        danceSelectorScreen.ids['loader']._update_files()
        app.sm.current = 'Load audio metadata'

class SongSegment_Handle(Widget, EventDispatcher):
    active_edit = BooleanProperty(False)

    #__events__ = ('on_handle_adjusted')

    def __init__(self, pos, size,**kwargs):
        offset = 20
        trigger_pos = (pos[0] - offset, pos[1])
        trigger_size = (size[0] + 2*offset, size[1])
        self.register_event_type('on_handle_adjusted')
        super(SongSegment_Handle, self).__init__(pos = trigger_pos, size = trigger_size, **kwargs)
        with self.canvas:
            self.rect = Rectangle(pos = pos, size = size)

    def on_touch_move(self, touch):
        print("touch move in handle: self.pos: {}, self.size: {} active_edit".format(self.pos, self.size, self.active_edit))

        if self.collide_point(*touch.pos) and not self.active_edit:
            self.active_edit = True

        print("active edit: {}".format(self.active_edit))
        if self.active_edit:
            self.rect.pos = (touch.x, self.rect.pos[1])
            self.pos = (touch.x, self.pos[1])
            return True
        else:
            super(SongSegment_Handle, self).on_touch_move(touch)

    """def on_touch_down(self, touch):
        self.active_edit = True
        print("touch down active_edit: {}", self.active_edit)
        return False"""

    def on_handle_adjusted(self, *args):
        pass

    def on_touch_up(self, touch):
        self.active_edit = False
        print("touch up")
        self.dispatch('on_handle_adjusted')
        return True

class SongSegment_graphical(Widget):
    end_pos = NumericProperty(0)
    start_pos = NumericProperty(0)
    label = ObjectProperty()

    def __init__(self, start_pos, **kwargs):
        super(SongSegment_graphical, self).__init__(**kwargs)
        with self.canvas.before:
            Color(0.0, 0.0, 1.0)
            self.rect = Rectangle(pos = start_pos, size = (1,100))
            self.start_pos = start_pos[0]
            self.pos = self.rect.pos
            self.size = self.rect.size

    def reScale(self):
        width = self.end_pos - self.start_pos
        if width > 0:
            self.rect.size = (width, 100)
            self.size = self.rect.size
        if self.label:
            self.update_label()

    def move_start(self):
        offset = self.rect.pos[0] - self.start_pos
        yPos = self.rect.pos[1]
        #self.end_pos += offset
        self.rect.pos = (self.start_pos, yPos)
        self.pos = self.rect.pos
        self.reScale()

    def on_handles_adjusted(self, *args):
        #width_tuple = (self.width, 0)
        self.end_pos = self.endHandle.rect.pos[0] #+ self.width
        self.start_pos = self.startHandle.rect.pos[0]
        self.move_start()

    def add_label(self, text):
        with self.canvas:
            Color(1.0, 1.0, 1.0)
            self.label = EditableLabel(text = text, pos = (self.rect.pos[0] + self.rect.size[0]/2, self.rect.pos[1] - 200))
            self.label.texture_update()
            label_width_offset = self.label.texture.size[0] / 2

            self.label.pos = (self.label.pos[0] - label_width_offset , self.rect.pos[1] - 100)
            self.label.texture_update()
            self.add_widget(self.label)

    def update_label(self):
        newLabel_pos_x = self.rect.pos[0] + self.rect.size[0]/2
        self.label.pos = (newLabel_pos_x, self.label.pos[1])
        self.label.texture_update()
        label_width_offset = self.label.texture.size[0] / 2

        self.label.pos = (self.label.pos[0] - label_width_offset , self.rect.pos[1] - 100)
        self.label.texture_update()

    def on_touch_down(self, touch):
        if self.collide_point(*touch.pos):
            print("On segment")
            self.highlight_segment()
            return True
        elif self.label.collide_point(*touch.pos):
            self.label.on_touch_down(touch)
            print("on label")
            return True
        else:
            self.unhighlight_segment(touch)
            print("somewhere else")

    def highlight_segment(self):
        #pdb.set_trace()
        if len(self.children) == 1:
            with self.canvas:
                #pdb.set_trace()
                Color(1.0, 1.0, 0.0)
                self.width = 5
                self.startHandle = SongSegment_Handle(pos = (self.start_pos, self.rect.size[1] - 40), size = (self.width, 300))
                self.startHandle.bind(on_handle_adjusted = self.on_handles_adjusted)
                self.endHandle = SongSegment_Handle(pos = (self.end_pos - self.width, self.rect.size[1] - 40), size = (self.width, 300))
                self.endHandle.bind(on_handle_adjusted = self.on_handles_adjusted)
                self.add_widget(self.startHandle)
                self.add_widget(self.endHandle)

    def unhighlight_segment(self, touch):
        #pdb.set_trace()
        if len(self.children) == 3:
            if not (self.startHandle.collide_point(*touch.pos) or self.endHandle.collide_point(*touch.pos)):
                self.remove_widget(self.startHandle)
                self.startHandle.canvas.remove(self.startHandle.rect)
                self.remove_widget(self.endHandle)
                self.endHandle.canvas.remove(self.endHandle.rect)
class SegmentCreatorScreen(Screen):
    def __init__(self,**kwargs):
        super(SegmentCreatorScreen, self).__init__(**kwargs)
        app = App.get_running_app()
        self.sound_pos = 0
        self.tagged = False
        self.elementList = []
        audio_basename = os.path.basename(app.sound.source)
        audio_basename = os.path.splitext(audio_basename)[0]
        self.SegmentModel = segmentModel.songMetadata("Dance_{}".format(audio_basename))
        self.SegmentModel.audioPath = app.sound.source
        self.ids['songTitle'].text = audio_basename

    def reload_audio(self):
        app = App.get_running_app()
        audioPath = app.sound.source
        app.sound.unload()
        self.sound = SoundLoader.load(self.SegmentModel.audioPath)

    def toggle_tag(self):
        playhead_pos = self.ids['waveform_holder'].children[0].visualizer.pH.rect.pos
        playhead = self.ids['waveform_holder'].children[0].visualizer.pH
        audio_visual_conversion = 1/playhead.visual_audio_rate * 1000.0

        if not self.tagged:
            self.tagged = True
            waveform_widget = self.ids['waveform_holder'].children[0].visualizer
            with waveform_widget.canvas.before:
                SsG = SongSegment_graphical(playhead_pos)
                self.elementList.append(SsG)
                #pdb.set_trace()
                waveform_widget.add_widget(SsG, index = 1)
                Clock.schedule_interval(self.update_tag, 1/60.0)

        else:
            self.tagged = False
            self.elementList[self.currentIndex].end_pos = playhead_pos[0]
            self.elementList[self.currentIndex].reScale()
            Clock.unschedule(self.update_tag)

            start_time = self.elementList[self.currentIndex].start_pos * audio_visual_conversion
            end_time = self.elementList[self.currentIndex].end_pos * audio_visual_conversion
            testText = "segment no.{}".format(self.currentIndex)

            self.SegmentModel.add_segment(start_time, end_time, description = testText)
            self.elementList[self.currentIndex].add_label(testText)

        self.currentIndex = len(self.elementList) - 1

    def enable_playback(self):
        #app = App.get_running_app()
        if self.sound.state == 'stop':
            #pdb.set_trace()
            playhead = self.ids['waveform_holder'].children[0].visualizer.pH
            self.sound_pos = playhead.playHead_time#self.sound.get_pos()
            self.sound.play()
            if self.sound_pos < self.sound.length:
                self.sound.seek(self.sound_pos)
        #    print("set head to {} but really {}".format(self.sound_pos, self.sound.length))
            self.ids['playBtn'].text = 'pause'
        else:
            self.sound.stop()
            #pdb.set_trace()
            self.ids['playBtn'].text = 'Play'

    def update_tag(self, dt):
        #pdb.set_trace()
        if self.currentIndex >= 0:
            playHead = self.ids['waveform_holder'].children[0].visualizer.pH

            #pos_x = self.sound.get_pos() * playHead.visual_audio_rate + playHead.start_x

            playhead_pos = self.ids['waveform_holder'].children[0].visualizer.pH.rect.pos
            #print("playhead pos {}".format(playhead_pos[0]))
            self.elementList[self.currentIndex].end_pos = playhead_pos[0]
            self.elementList[self.currentIndex].reScale()

    def save(self):
        if len(self.elementList) > 0 and len(self.SegmentModel.segments) > 0:
            print("Segments: {}, visual elements: {}".format(len(self.SegmentModel.segments), len(self.elementList)))
            for element, segment in zip(self.elementList, self.SegmentModel.segments):
                segment.description = element.label.text
        self.SegmentModel.exportDataToAudioLoc("TempTest", override = True)

class SegmentSelectorScreen(Screen):
    def __init__(self, **kwargs):
        super(SegmentSelectorScreen, self).__init__(**kwargs)
        self.playlist = []
        self.shouldLoop = False

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
            filePath = "../data/_cache/intermed.mp3"
            if os.path.exists(filePath):
                os.remove(filePath)
            thefile = music.export(filePath, format="mp3")
            thefile.seek(0)
            app.sound = SoundLoader.load(thefile.name) # redefinied need new bind
            app.sound.loop = self.shouldLoop
            app.sound.bind(on_stop = self.on_stopped)
            self.ids['playbtn'].text = 'stop'
            app.sm.add_widget(PlaybackScreen(music, app.sound, name ='player'))
            if app.root.has_screen('player'):
                app.root.current = 'player'
            #pdb.set_trace()
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
        self.sm.add_widget(FileChooserScreen_Choreography(name='Load audio metadata'))
        self.sm.add_widget(FileChooserScreen_Song(name = 'RawSongLoader'))
        return self.sm

    def load_data(self, filePath):
            #self.SegmentModel.clearData()
        self.SegmentModel = segmentModel.songMetadata()
        self.SegmentModel.importData(filePath)
        audioPath = os.path.join(os.path.split(filePath)[0], self.SegmentModel.audioPath)
        self.audioSegment = AudioSegment.from_mp3(audioPath)
        self.sound = SoundLoader.load(audioPath)

    def load_song(self, audioPath):
        self.audioSegment = AudioSegment.from_mp3(audioPath)
        self.sound = SoundLoader.load(audioPath)

if __name__ == '__main__':
    ChoreographyCreator().run()
