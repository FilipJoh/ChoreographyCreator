import kivy

from kivy.app import App
from kivy.uix.gridlayout import GridLayout
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.checkbox import CheckBox

from kivy.uix.filechooser import FileChooserListView

#from kivy.uix.floatlayout import FloatLayout
#from kivy.factory import Factory
#from kivy.properties import ObjectProperty
#from kivy.uix.popup import Popup

class mainLayout(GridLayout):

    def __init__(self, rows, **kwargs):
        super(mainLayout, self).__init__(**kwargs)
        self.rows = rows
        for i in range(0,rows):

            self.add_widget(Label(text='test {}'.format(i)))
            CB = CheckBox()
            self.add_widget(CB)
            CB.bind(active=on_checkbox_active)

        #self.add_widget(Label(text='test 1'))
        #self.add_widget(Label(text='test 1'))



class MacroLayout(BoxLayout):
    def __init__(self, **kwargs):
        super(MacroLayout, self).__init__(**kwargs)
        self.orientation = 'horizontal'

        #self.add_widget(Label(text='AHUBA'))

        self.filechooser = FileChooserListView()
        self.filechooser.layout.ids.scrollview.scroll_type = ['content', 'bars']
        self.filechooser.layout.ids.scrollview.do_scroll_x = True
        #self.filechooser.layout.ids.scrollview.scroll_y = 3.0
        self.filechooser.layout.ids.scrollview.bar_width = 10.0
        self.filechooser.layout.ids.scrollview.height = 100.0
        self.filechooser.path = "C:\\Users\\Filip\\"
        self.add_widget(self.filechooser)
        self.add_widget(mainLayout(12))

class ChoreographyCreator(App):

    def build(self):
        return MacroLayout()#mainLayout(13)

def on_checkbox_active(checkbox, value):
    if value:
        print('The checkbox', checkbox, 'is active')
    else:
        print('The checkbox', checkbox, 'is inactive')

if __name__ == '__main__':
    ChoreographyCreator().run()
