
import json
from settings import HIGH_SCORE_FILE

class Leaderboard:
    def __init__(self):
        self.filepath = HIGH_SCORE_FILE
        self.scores = self.load_scores()

    def load_scores(self):
        try:
            with open(self.filepath, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def save_scores(self):
        with open(self.filepath, 'w') as f:
            json.dump(self.scores, f, indent=4)

    def add_score(self, name, score):
        self.scores.append({'name': name, 'score': score})
        self.scores.sort(key=lambda x: x['score'], reverse=True)
        self.scores = self.scores[:10] # Keep top 10
        self.save_scores()

    def get_scores(self):
        return self.scores
