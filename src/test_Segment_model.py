import segmentModel
import pdb

# Create a simple model and export to xml
SM = segmentModel.songMetadata('song name here')
SM.add_segment(0, 200)
SM.add_segment(200, 600)
SM.exportData('testy')

# import the file again
SM = segmentModel.songMetadata('ahuba')
SM.importData('testy.xml')
