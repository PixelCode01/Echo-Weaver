import pygame

class EnemyTrail(pygame.sprite.Sprite):
    def __init__(self, position, color, size):
        super().__init__()
        self.image = pygame.Surface((size, size), pygame.SRCALPHA)
        self.color = color
        self.image.fill(self.color)
        self.rect = self.image.get_rect(center=position)
        self.lifetime = 30 # frames
        self.initial_lifetime = self.lifetime

    def update(self):
        self.lifetime -= 1
        if self.lifetime <= 0:
            self.kill()
        
        alpha = int(255 * (self.lifetime / self.initial_lifetime))
        self.image.set_alpha(alpha)
