import os
import sys
import json
from watson_developer_cloud import NaturalLanguageUnderstandingV1
from watson_developer_cloud.natural_language_understanding_v1 \
  import Features, EntitiesOptions


class TranscriptionAnalysis:
	def __init__(self, file_path):
		self.filename = file_path

	def analysis(self):
		natural_language_understanding = NaturalLanguageUnderstandingV1(
		  username='faaf99a6-be93-49f0-ad68-56a8169cc24c',
		  password='YCCSNh3hwIGO',
		  version='2018-03-16')
		file = open("audios/" + self.filename, 'a+')
		text = file.read()
		print("Waiting for the response")
		response = natural_language_understanding.analyze(
		   text=text,
		   features=Features(entities=EntitiesOptions()))
		outputFile = open("output_" + self.filename, 'w')
		for entity in response.get_result()["entities"]:
			outputFile.write(json.dumps(entity))
			outputFile.write("\n")
		print("Finish analyzing")


if __name__ == "__main__":
    if len(sys.argv) == 1:
        print("Error: Input file required")
        sys.exit(2)
    ins = TranscriptionAnalysis(sys.argv[1])
    ins.analysis()



	





