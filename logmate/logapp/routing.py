# logsapp/routing.py
# from django.urls import re_path
# from .consumers import LogStatusConsumer

# websocket_urlpatterns = [
#     re_path(r'^ws/logstatus/$', LogStatusConsumer.as_asgi()),
# ]


from django.urls import path
from channels.routing import ProtocolTypeRouter, URLRouter
from logapp.consumers import LogStatusConsumer

websocket_urlpatterns = [
    path('ws/logstatus/', LogStatusConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    'websocket': URLRouter(websocket_urlpatterns),
})
