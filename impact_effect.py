import pygame
from settings import *

class ImpactEffect(pygame.sprite.Sprite):
    def __init__(self, position, color):
        super().__init__()
        self.image = pygame.Surface((10, 10), pygame.SRCALPHA)
        self.color = color
        self.rect = self.image.get_rect(center=position)
        self.lifetime = 10
        self.max_radius = 20

    def update(self):
        self.lifetime -= 1
        if self.lifetime <= 0:
            self.kill()
        
        current_radius = int(self.max_radius * (1 - (self.lifetime / 10)))
        alpha = int(255 * (self.lifetime / 10))

        self.image.fill((0, 0, 0, 0))
        pygame.draw.circle(self.image, (self.color[0], self.color[1], self.color[2], alpha), (self.max_radius, self.max_radius), current_radius, 2)
        self.rect = self.image.get_rect(center=self.rect.center)
