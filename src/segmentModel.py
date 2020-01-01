import xml.etree.ElementTree as ET
import prettierfier
from bs4 import BeautifulSoup
import pdb
from re import split

class segment:

    def encode(self, parentElement):
        songSegment = ET.SubElement(parentElement, "songSegment")
        #songSegment.text = self.description
        descriptionElement = ET.SubElement(songSegment, "description")
        descriptionElement.text = self.description
        startElement = ET.SubElement(songSegment, "start")
        startElement.text = str(self.start)
        endElement = ET.SubElement(songSegment, "end")
        endElement.text = str(self.end)

    def __init__(self, start, end, description = 'Not decided yet'):
        self.description = description
        self.start = start
        self.end = end


class songMetadata:

    def exportData(self, fileName):
        self.xmlElement.set('name', self.name)
        for segment in self.segments:
            segment.encode(self.xmlElement)

        data = BeautifulSoup(ET.tostring(self.xmlElement, encoding='utf-8'), 'xml')
        dataString = data.prettify()
        dataString = prettierfier.prettify_xml(dataString)
        fileName = '{}.xml'.format(fileName)

        with open(fileName, 'w') as f:
            f.write(dataString)

    def importData(self, fileName):
        tree = ET.parse(fileName)
        self.xmlElement = tree.getroot()
        self.name = self.xmlElement.get('name')
        for seg in self.xmlElement.findall('songSegment'):
            description = seg.find('description').text
            start = int(seg.find('start').text)
            end = int(seg.find('end').text)
            self.segments.append(segment(start, end, description))

    def clearData(self):
        self.segments.clear()

    def add_segment(self, start, end,  description = 'Not decided yet'):
        self.segments.append(segment(start, end,  description))

    def __init__(self,name):
        self.name = name
        self.segments = []
        self.xmlElement = ET.Element('song')
        #self.xmlElement.text = self.name
