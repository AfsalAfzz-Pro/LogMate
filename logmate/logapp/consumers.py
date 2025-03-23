# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class LogStatusConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # Add this connection to the "logstatus_group"
#         await self.channel_layer.group_add(
#             "logstatus_group",
#             self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         # Remove this connection from the group
#         await self.channel_layer.group_discard(
#             "logstatus_group",
#             self.channel_name
#         )

#     # This method name must match the "type" in group_send -> "logstatus.update"
#     async def logstatus_update(self, event):
#         # event["progress"] is what we sent from the Celery task
#         await self.send(text_data=json.dumps({
#             "progress": event["progress"]
#         }))


import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LogStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "logstatus_group",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "logstatus_group",
            self.channel_name
        )

    async def logstatus_update(self, event):
        # Distinguish between chunk updates and final completion
        if event["event"] == "CHUNK":
            await self.send(text_data=json.dumps({
                "event": "CHUNK",
                "chunkIndex": event["chunkIndex"],
                "totalChunks": event["totalChunks"],
                "processedCount": event["processedCount"],
                "totalLines": event["totalLines"],
            }))
        elif event["event"] == "COMPLETE":
            await self.send(text_data=json.dumps({
                "event": "COMPLETE",
                "result": event["result"],
            }))

    async def log_status(self, event):
        """
        Handler for log_status type messages.
        This receives the message sent by the Celery task and forwards it to the WebSocket.
        """
        # Remove 'type' from the event as it's not needed in the response
        message_data = {k: v for k, v in event.items() if k != 'type'}
        
        # Send the message to the WebSocket
        await self.send(text_data=json.dumps(message_data))
