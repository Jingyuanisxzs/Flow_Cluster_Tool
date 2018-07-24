#
# Flow_Cluster_Tool/public/python/decode_omx.py ---
#

# @todo: Currently uncompresses all the files.
#        It should be able to uncompress a single ".omx" at a time.
#        That way a single file can be uncompressed at a time.

import csv
import json
import numpy as np
import openmatrix as omx
import os
import sys
import time

omxFilePath = './public/data/compressed/flow_matrices_' + sys.argv[1] + '_' + sys.argv[2] + '_' + sys.argv[3] + '.omx'
decodedOmxPath = './public/data/uncompressed/flow_data_' + sys.argv[1] + '_' + sys.argv[2] + '_' + sys.argv[3]

if not os.path.exists("./public/data/compressed"):
    os.makedirs('./public/data/compressed')
if not os.path.exists("./public/data/uncompressed"):
    os.makedirs('./public/data/uncompressed')



print ("Uncompressing :"+omxFilePath)

myfile = omx.open_file(omxFilePath)
    # create the folder if not exist
if not os.path.exists(decodedOmxPath):
    os.makedirs(decodedOmxPath)
    lookUpTable = myfile.mapping('zone number')
    inverted_LUT = dict([[v, k] for k, v in lookUpTable.items()])
    zoneLatLongDict = {}
    indexLatLongDict = {}

    with open('./public/data/geoInfo/ZonesCoordinates.csv', mode='r') as infile:
        read = csv.reader(infile)
        zoneLatLongDict = {rows[0]: [rows[1], rows[2]] for rows in read}

        # print(zoneLatLongDict['101'])
    # for key,value in inverted_LUT.items():
    #     print(key,value,zoneLatLongDict[str(value)])

    # indexLatLongDict = {key:json.dumps([value,zoneLatLongDict[str(value)][0],zoneLatLongDict[str(value)][1]]) for key,value in inverted_LUT.items()}
    for key, value in inverted_LUT.items():
        indexLatLongDict[key] = json.dumps(
            [str(value), zoneLatLongDict[str(value)][0], zoneLatLongDict[str(value)][1]])
    with open(decodedOmxPath + '/indexLatLongDict.csv', 'wb') as f:  # Just use 'w' mode in 3.x
        w = csv.DictWriter(f, indexLatLongDict.keys())
        w.writeheader()
        w.writerow(indexLatLongDict)

    with open(decodedOmxPath + '/pecas_matrices_title.csv', 'wb') as pecasTitle_csvfile:
        titleWriter = csv.writer(pecasTitle_csvfile, delimiter=',')
        for i in myfile.list_matrices():
            titleWriter.writerow([i])

    for title in myfile.list_matrices():
        flow_file = myfile[title]
        header = list(range(flow_file.shape[0]))
        with open(decodedOmxPath + '/' + title + '.csv', 'wb') as csvfile:
            spamwriter = csv.writer(csvfile, delimiter=',')
            spamwriter.writerow(header)
            spamwriter.writerows(flow_file)


myfile.close()