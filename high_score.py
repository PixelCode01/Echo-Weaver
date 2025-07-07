import os
from leaderboard import Leaderboard

class HighScoreManager:
    def __init__(self):
        self.leaderboard = Leaderboard()

    def save_high_score(self, name, score):
        self.leaderboard.add_score(name, score)

    def get_high_score(self):
        scores = self.leaderboard.get_scores()
        if scores:
            return scores[0]['score']
        return 0

    def get_leaderboard(self):
        return self.leaderboard.get_scores()
