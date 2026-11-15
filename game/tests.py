from django.test import SimpleTestCase
from .charts import make_chart

class ChartTests(SimpleTestCase):
    def test_difficulties_share_music_and_duration(self):
        for level in range(1,4):
            charts=[make_chart(level,d) for d in ('easy','medium','hard','insane')]
            counts=[len(c['notes']) for c in charts]
            self.assertEqual(counts,sorted(set(counts)))
            for c in charts:
                self.assertEqual(c['music'],charts[0]['music'])
                self.assertEqual(c['duration'],charts[0]['duration'])
                self.assertEqual(c['bpm'],charts[0]['bpm'])
                self.assertEqual(c['speed'],charts[0]['speed'])
                self.assertEqual(c['attacks'],charts[0]['attacks'])
                self.assertGreater(c['duration'],100)
            player= [n for n in charts[-1]['notes'] if n['side']=='player']
            self.assertLess(len({n['time'] for n in player}),len(player))
        self.assertEqual(self.client.get('/api/charts/1/?difficulty=wrong').status_code,400)

    def test_progressive_density_and_speed(self):
        charts = [make_chart(i) for i in range(1, 4)]
        density = [len(c['notes']) / c['duration'] for c in charts]
        self.assertLess(density[0], density[1])
        self.assertLess(density[1], density[2])
        self.assertEqual([c['bpm'] for c in charts], [128,158,190])

    def test_charts_are_playable_and_deterministic(self):
        for level in range(1, 4):
            c = make_chart(level)
            self.assertEqual(c, make_chart(level))
            self.assertEqual(c['notes'], sorted(c['notes'], key=lambda n:n['time']))
            self.assertEqual({n['side'] for n in c['notes']}, {'enemy','player'})
            self.assertTrue(any(n['hold'] for n in c['notes']))
            seen = set()
            for n in c['notes']:
                self.assertIn(n['lane'], range(4))
                self.assertLess(n['time']+n['hold'], c['duration'])
                key = (n['side'], n['time'], n['lane'])
                self.assertNotIn(key, seen)
                seen.add(key)
            # Sustains must finish before another note in the same lane.
            for n in c['notes']:
                if n['hold']:
                    self.assertFalse(any(m['side']==n['side'] and m['lane']==n['lane'] and n['time']<m['time']<n['time']+n['hold'] for m in c['notes']))

    def test_attacks_only_in_final_and_spaced(self):
        self.assertEqual(make_chart(1)['attacks'], [])
        self.assertEqual(make_chart(2)['attacks'], [])
        c = make_chart(3)
        self.assertGreaterEqual(len(c['attacks']), 8)
        for a,b in zip(c['attacks'],c['attacks'][1:]):
            self.assertGreater(b-a, 2)

    def test_routes_and_invalid_levels(self):
        self.assertContains(self.client.get('/'), 'PONTO DE')
        self.assertEqual(len(self.client.get('/api/levels/').json()['levels']),3)
        for i in range(1,4):
            self.assertEqual(self.client.get(f'/api/charts/{i}/').json(),make_chart(i))
        self.assertEqual(self.client.get('/api/charts/4/').status_code,200)
        self.assertEqual(self.client.get('/api/charts/5/').status_code,404)
        self.assertEqual(self.client.get('/api/charts/0/').status_code,404)

    def test_all_charts_validate_and_secret_escalates(self):
        from .validate_charts import validate
        for level in range(1,5):
            for difficulty in ('easy','medium','hard','insane'):
                self.assertGreater(validate(make_chart(level,difficulty)),0)
        secret=make_chart(4,'insane')
        notes=secret['notes']
        intro=secret['count_in']
        first=sum(1 for n in notes if intro<=n['time']<intro+20)
        last=sum(1 for n in notes if intro+60<=n['time']<intro+80)
        self.assertGreater(last,first)
        self.assertEqual(secret['player'],'cartman')
        self.assertEqual(secret['opponent'],'kyle')
        self.assertTrue(secret['audio_url'].endswith('.mp3'))
        self.assertGreater(len(secret['subtitles']),20)
