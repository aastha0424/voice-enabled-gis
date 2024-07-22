# server.py
import websockets
import asyncio

PORT = 7890
print(f"Server listening on Port {PORT}")

connected_clients = set()

async def echo(websocket, path):
    print("A client just connected")
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            print(f"Received message from client: {message}")
            for client in connected_clients:
                if client != websocket:
                    await client.send(f"Someone said: {message}")
    except websockets.exceptions.ConnectionClosed as e:
        print("A client just disconnected")
    finally:
        connected_clients.remove(websocket)

start_server = websockets.serve(echo, "localhost", PORT)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
