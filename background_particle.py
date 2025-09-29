import pygame
import random
from settings import *

class BackgroundParticle(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.size = random.randint(1, 3)
        self.image = pygame.Surface((self.size, self.size), pygame.SRCALPHA)
        self.color = BACKGROUND_PARTICLE_COLOR
        self.image.fill(self.color)
        self.rect = self.image.get_rect(center=(random.randint(0, WIDTH), random.randint(0, HEIGHT)))
        self.velocity = pygame.math.Vector2(random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5))

    def update(self):
        self.rect.move_ip(self.velocity)
        if self.rect.left > WIDTH: self.rect.right = 0
        if self.rect.right < 0: self.rect.left = WIDTH
        if self.rect.top > HEIGHT: self.rect.bottom = 0
        if self.rect.bottom < 0: self.rect.top = HEIGHT
