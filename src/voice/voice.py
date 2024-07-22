import speech_recognition as sr
import pyttsx3
import websockets
import asyncio

recognizer = sr.Recognizer()
engine = pyttsx3.init()

async def send_command(command):
    async with websockets.connect("ws://localhost:7890") as websocket:
        await websocket.send(command)
        response = await websocket.recv()
        print(f"Response from server: {response}")

while True:
    try:
        with sr.Microphone() as mic:
            recognizer.adjust_for_ambient_noise(mic, duration=0.2)
            audio = recognizer.listen(mic)

            text = recognizer.recognize_google(audio)
            text = text.lower()

            print(f"Recognized: {text}")
            engine.say(f"Recognized: {text}")
            engine.runAndWait()

            asyncio.get_event_loop().run_until_complete(send_command(text))

    except sr.UnknownValueError:
        recognizer = sr.Recognizer()
        continue
