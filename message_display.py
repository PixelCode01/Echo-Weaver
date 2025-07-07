
import pygame
from settings import MESSAGE_DISPLAY_DURATION, MESSAGE_FADE_SPEED

class MessageDisplay:
    def __init__(self):
        self.messages = []

    def add_message(self, text, position, color, font_size):
        self.messages.append({
            'text': text,
            'position': position,
            'color': color,
            'font_size': font_size,
            'timer': MESSAGE_DISPLAY_DURATION,
            'alpha': 255
        })

    def update(self):
        for msg in self.messages:
            msg['timer'] -= 1
            if msg['timer'] <= 0:
                msg['alpha'] -= MESSAGE_FADE_SPEED
                if msg['alpha'] <= 0:
                    self.messages.remove(msg)

    def draw(self, screen):
        for msg in self.messages:
            font = pygame.font.Font(None, msg['font_size'])
            text_surface = font.render(msg['text'], True, msg['color'])
            text_surface.set_alpha(msg['alpha'])
            screen.blit(text_surface, msg['position'])
