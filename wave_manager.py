import pygame
import random
from settings import *
from enemy import Enemy, ZigzagEnemy, GhostEnemy, ChargerEnemy, SplitterEnemy, ShieldedEnemy, HealerEnemy, SpawnerEnemy, DisruptorEnemy

class WaveManager:
    def __init__(self):
        self.current_wave = 0
        self.enemies_to_spawn = 0
        self.spawned_enemies_count = 0
        self.spawn_timer = 0
        self.wave_active = False
    self.enemy_speed = ENEMY_SPEED

    def start_next_wave(self):
        self.current_wave += 1
        self.enemies_to_spawn = ENEMIES_PER_WAVE_BASE + (self.current_wave - 1) * ENEMIES_PER_WAVE_INCREMENT
        self.spawned_enemies_count = 0
        self.spawn_timer = 0
        self.wave_active = True
        self.enemy_speed = ENEMY_SPEED + (self.current_wave - 1) * 0.2
        if self.enemy_speed > ENEMY_MAX_SPEED:
            self.enemy_speed = ENEMY_MAX_SPEED
        print(f"Starting Wave {self.current_wave} with {self.enemies_to_spawn} enemies.")

    def update(self, enemies_group, core):
        if not self.wave_active:
            return

        self.spawn_timer += 1
        spawn_rate = ENEMY_SPAWN_RATE - (self.current_wave - 1) * SPAWN_RATE_DECREMENT
        if spawn_rate < 10:
            spawn_rate = 10

        if self.spawn_timer >= spawn_rate and self.spawned_enemies_count < self.enemies_to_spawn:
            self.spawn_timer = 0
            self._spawn_enemy(enemies_group)
            self.spawned_enemies_count += 1

        if self.spawned_enemies_count >= self.enemies_to_spawn and len(enemies_group) == 0:
            self.wave_active = False
            print(f"Wave {self.current_wave} completed!")

    def _spawn_enemy(self, enemies_group):
        enemy_type_roll = random.random()

        if self.current_wave >= 10 and enemy_type_roll < 0.05:
            enemies_group.add(DisruptorEnemy())
        elif self.current_wave >= 9 and enemy_type_roll < 0.05:
            enemies_group.add(SpawnerEnemy())
        elif self.current_wave >= 8 and enemy_type_roll < 0.08:
            enemies_group.add(HealerEnemy())
        elif self.current_wave >= 7 and enemy_type_roll < 0.1:
            enemies_group.add(ShieldedEnemy())
        elif self.current_wave >= 5 and enemy_type_roll < 0.15:
            enemies_group.add(SplitterEnemy())
        elif self.current_wave >= 3 and enemy_type_roll < 0.15:
            enemies_group.add(GhostEnemy())
        elif self.current_wave >= 5 and enemy_type_roll < 0.1:
            enemies_group.add(ChargerEnemy())
        elif enemy_type_roll < 0.3:
            enemies_group.add(ZigzagEnemy())
        else:
            enemies_group.add(Enemy())
