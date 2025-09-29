
import pygame
import math
from settings import *

class Core(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((CORE_RADIUS * 2, CORE_RADIUS * 2), pygame.SRCALPHA)
        pygame.draw.circle(self.image, BLUE, (CORE_RADIUS, CORE_RADIUS), CORE_RADIUS)
        for i in range(5):
            angle = i * (2 * math.pi / 5) + pygame.time.get_ticks() * 0.001
            x = CORE_RADIUS + CORE_RADIUS * 0.5 * math.cos(angle)
            y = CORE_RADIUS + CORE_RADIUS * 0.5 * math.sin(angle)
            pygame.draw.circle(self.image, CORE_ENERGY_FLOW_COLOR, (int(x), int(y)), 2)
        self.rect = self.image.get_rect(center=(WIDTH // 2, HEIGHT // 2))
        self.hit_timer = 0
        self.pulse_timer = 0
        self.is_invincible = False

    def draw(self, screen, fever_mode_active=False):
        screen.blit(self.image, self.rect)
        self.pulse_timer = (self.pulse_timer + 1) % 60
        pulse_scale = 1 + 0.1 * math.sin(self.pulse_timer / 60 * 2 * math.pi)
        pulse_radius = int(CORE_RADIUS * pulse_scale)
        pulse_alpha = int(150 + 100 * (1 - abs(self.pulse_timer - 30) / 30))
        s = pygame.Surface((pulse_radius * 2, pulse_radius * 2), pygame.SRCALPHA)
        pygame.draw.circle(s, (CORE_PULSE_COLOR[0], CORE_PULSE_COLOR[1], CORE_PULSE_COLOR[2], pulse_alpha), (pulse_radius, pulse_radius), pulse_radius)
        screen.blit(s, s.get_rect(center=self.rect.center))
        if self.hit_timer > 0:
            overlay = pygame.Surface((CORE_RADIUS * 2, CORE_RADIUS * 2), pygame.SRCALPHA)
            alpha = int(255 * (self.hit_timer / CORE_HIT_ANIMATION_DURATION))
            overlay.fill((255, 0, 0, alpha))
            screen.blit(overlay, self.rect)
            self.hit_timer -= 1
        if self.is_invincible:
            shield_alpha = int(100 + 50 * math.sin(pygame.time.get_ticks() / 100))
            shield_radius = CORE_RADIUS + 10
            s = pygame.Surface((shield_radius * 2, shield_radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, (CORE_SHIELD_COLOR[0], CORE_SHIELD_COLOR[1], CORE_SHIELD_COLOR[2], shield_alpha), (shield_radius, shield_radius), shield_radius, 3)
            screen.blit(s, s.get_rect(center=self.rect.center))
        if fever_mode_active:
            fever_alpha = int(150 + 100 * math.sin(pygame.time.get_ticks() / 50))
            fever_radius = CORE_RADIUS + 15
            s = pygame.Surface((fever_radius * 2, fever_radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(s, (FEVER_MODE_COLOR[0], FEVER_MODE_COLOR[1], FEVER_MODE_COLOR[2], fever_alpha), (fever_radius, fever_radius), fever_radius, 5)
            screen.blit(s, s.get_rect(center=self.rect.center))

    def on_hit(self):
        self.hit_timer = CORE_HIT_ANIMATION_DURATION

    def set_invincible(self, invincible):
        self.is_invincible = invincible
