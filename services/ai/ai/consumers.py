import json
import numpy as np
from channels.generic.websocket import AsyncWebsocketConsumer
from ai.models import PongAI
from ai.models import DQNAgent

class AIConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.agent = None
        self.state = None
        self.action = None
        await self.accept()

    async def disconnect(self, close_code):
        self.agent = None
        self.state = None
        self.action = None

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['command'] == 'start':
            state_size = 4
            action_size = 2
            self.agent = DQNAgent(state_size, action_size)
        elif data['command'] == 'stop':
            self.agent = None
        
        next_state = np.reshape(data['state'], [1, 4])
        reward = data['reward']
        done = data['done']
        
        if self.state is not None and self.action is not None:
            self.agent.remember(self.state, self.action, reward, next_state, done)
            if len(self.agent.memory) > 32:
                self.agent.replay(32)
            if done:
                self.agent.update_target_model()

        self.state = next_state
        self.action = self.agent.act(self.state)
        
        await self.send(text_data=json.dumps({
            'action': self.action
        }))