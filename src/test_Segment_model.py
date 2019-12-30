import segmentModel
import pdb

# Create a simple model and export to xml
SM = segmentModel.songMetadata('song name here')
SM.add_segment(2000, 5000, 'Intro')
SM.add_segment(5000, 1000, 'Vattenspridare')
SM.add_segment(10000, 15000, 'TjernobylMåsen')
SM.exportData('testy')

# import the file again
SM = segmentModel.songMetadata('ahuba')
SM.importData('testy.xml')
