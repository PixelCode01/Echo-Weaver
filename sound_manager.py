import pygame
import os

class SoundManager:
    def __init__(self):
        
        self.sounds = {}
        self._load_sounds()

    def _load_sound(self, filename):
        """Loads a sound file, handling errors gracefully."""
        try:
            path = os.path.join('assets', 'sounds', filename)
            sound = pygame.mixer.Sound(path)
            return sound
        except FileNotFoundError:
            return None
        except Exception as e:
            return None

    def _load_sounds(self):
        """Loads all game sounds."""
        self.sounds['wave_create'] = self._load_sound('create_wave.wav')
        self.sounds['enemy_hit'] = self._load_sound('enemy_hit.wav')
        self.sounds['game_over'] = self._load_sound('game_over.wav')
        self.sounds['powerup_collect'] = self._load_sound('powerup_collect.wav')
        self.sounds['echo_burst'] = self._load_sound('echo_burst.wav')

    def play_sound(self, sound_name):
        """Plays a sound if it has been loaded successfully."""
        sound = self.sounds.get(sound_name)
        if sound:
            sound.play()
        else:
            print(f"Warning: Attempted to play unknown or unloaded sound: {sound_name}")
