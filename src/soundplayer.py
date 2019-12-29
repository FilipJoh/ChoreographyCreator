from pydub import AudioSegment
from pydub.playback import play
import segmentModel

SM = segmentModel.songMetadata('song name here')
SM.importData('testy.xml')

mp3_version = AudioSegment.from_mp3("../audio/08 Rasputin.mp3")
first_10_seconds = mp3_version[SM.segments[0].start:SM.segments[0].end]
secondPart = mp3_version[SM.segments[1].start:SM.segments[1].end]

# Need interupt
#while(True):
print("playing")
play(first_10_seconds + secondPart)
