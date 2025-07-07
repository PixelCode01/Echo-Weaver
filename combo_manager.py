
import pygame
import random
from settings import COMBO_TIME_LIMIT, COMBO_BONUS_MULTIPLIER, COMBO_MESSAGES

class ComboManager:
    def __init__(self):
        self.combo_count = 0
        self.combo_timer = 0

    def add_hit(self):
        self.combo_count += 1
        self.combo_timer = COMBO_TIME_LIMIT

    def update(self):
        if self.combo_timer > 0:
            self.combo_timer -= 1
            if self.combo_timer == 0:
                self.combo_count = 0

    def get_bonus(self):
        return int(self.combo_count * COMBO_BONUS_MULTIPLIER)

    def get_combo_message(self):
        if self.combo_count > 1:
            return random.choice(COMBO_MESSAGES)
        return ""
