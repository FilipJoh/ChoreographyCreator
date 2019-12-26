from pydub import AudioSegment
from pydub.playback import play

mp3_version = AudioSegment.from_mp3("../audio/08 Rasputin.mp3")
ten_seconds = 5 * 1000
first_10_seconds = mp3_version[:ten_seconds]

# Need interupt
while(True):
    play(first_10_seconds)
