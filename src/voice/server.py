import asyncio
import json
import websockets
from commandPatterns import identify_command

PORT = 7890
COMMAND_LIMIT = 20  # Number of commands after which to disconnect

connected_clients = set()

async def echo(websocket, path):
    print("A client just connected")
    connected_clients.add(websocket)
    
    command_count = 0  # Initialize command count for each client
    
    try:
        async for message in websocket:
            if command_count >= COMMAND_LIMIT:
                print("Command limit reached. Disconnecting client.")
                await websocket.close()  # Close connection
                break
            
            print(f"Received message from client: {message}")
            command_result = identify_command(message)
            response = json.dumps(command_result)
            print(f"Sending response to client: {response}")
            await websocket.send(response)
            
            command_count += 1  # Increment command count
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"ConnectionClosed exception: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        connected_clients.remove(websocket)

async def start_server():
    while True:
        try:
            print(f"Starting server on port {PORT}")
            server = await websockets.serve(echo, "localhost", PORT)
            await server.wait_closed()
        except Exception as e:
            print(f"Server encountered an error: {e}")
            print("Restarting server in 5 seconds...")
            await asyncio.sleep(5)  # Wait before restarting

if __name__ == "__main__":
    asyncio.run(start_server())
