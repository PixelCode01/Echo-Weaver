
import pygame
import random

class ScreenShake:
    def __init__(self, intensity, duration):
        self.intensity = intensity
        self.duration = duration
        self.timer = 0

    def shake(self):
        if self.timer < self.duration:
            self.timer += 1
            offset_x = random.randint(-self.intensity, self.intensity)
            offset_y = random.randint(-self.intensity, self.intensity)
            return (offset_x, offset_y)
        return (0, 0)
