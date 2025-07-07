
import pygame
from settings import FEVER_MODE_DURATION, FEVER_MODE_THRESHOLD, FEVER_MODE_CHARGE_PER_HIT

class FeverManager:
    def __init__(self):
        self.fever_charge = 0
        self.fever_active = False
        self.fever_timer = 0

    def add_charge(self, amount):
        if not self.fever_active:
            self.fever_charge += amount
            if self.fever_charge >= FEVER_MODE_THRESHOLD:
                self.activate_fever()

    def activate_fever(self):
        self.fever_active = True
        self.fever_timer = FEVER_MODE_DURATION
        self.fever_charge = 0

    def update(self):
        if self.fever_active:
            self.fever_timer -= 1
            if self.fever_timer <= 0:
                self.fever_active = False

    def get_charge_percentage(self):
        return (self.fever_charge / FEVER_MODE_THRESHOLD) * 100
