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

    def __init__(self, description = 'Not decided yet', start, end):
        self.description = description
        self.start = start
        self.end = end


class songMetadata:

    def export(self, fileName):
        name = ET.SubElement(self.xmlElement, "name")
        name.text = self.name
        for segment in self.segments:
            segment.encode(self.xmlElement)

        data = BeautifulSoup(ET.tostring(self.xmlElement, encoding='utf-8'), 'xml')
        dataString = data.prettify()
        #pdb.set_trace()
        dataString = prettierfier.prettify_xml(dataString)
        fileName = '{}.xml'.format(fileName)

        with open(fileName, 'w') as f:
            #f.write('<?xml version="1.0" encoding="UTF-8" ?>\n<!DOCTYPE xmeml>')
            #ElementTree.ElementTree(tree).write(f, 'utf-8')
            f.write(dataString)

    def add_segment(self, description, start, end):
        self.segments.append(segment())


    def __init__(self,name):
        self.name = name
        self.segments = []
        self.xmlElement = ET.Element('song')
        #self.xmlElement.text = self.name
