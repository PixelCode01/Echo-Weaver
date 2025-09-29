import pygame
import random
from settings import *

class DamageNumber(pygame.sprite.Sprite):
    def __init__(self, position, value, color=WHITE, is_critical=False):
        super().__init__()
        self.value = value
        self.color = color
        self.is_critical = is_critical
        self.position = pygame.math.Vector2(position)
        self.velocity = pygame.math.Vector2(random.uniform(-0.5, 0.5), -2)
        self.lifetime = HIT_NUMBER_LIFETIME
        self.initial_lifetime = self.lifetime

        self.font_size = FONT_SIZE_SCORE if not is_critical else FONT_SIZE_SCORE + 10
        self.font = pygame.font.Font(None, self.font_size)

        self._update_image()

    def _update_image(self):
        text_surface = self.font.render(str(self.value), True, self.color)
        self.image = pygame.Surface(text_surface.get_size(), pygame.SRCALPHA)
        self.image.blit(text_surface, (0, 0))
        self.rect = self.image.get_rect(center=self.position)

        alpha = int(255 * (self.lifetime / self.initial_lifetime))
        self.image.set_alpha(alpha)

    def update(self):
        self.position += self.velocity
        self.lifetime -= 1
        if self.lifetime <= 0:
            self.kill()
        self._update_image()
