#
# Flow_Cluster_Tool/public/python/decode_omx.py ---
#

import csv
import json
import numpy as np
import openmatrix as omx
import os
import sys
import time

####myfile = omx.open_file('./public/data/flow_matrices.omx')


flow_matrices_group = []

for file in os.listdir("./public/data"):
    if file.endswith(".omx"):
        flow_matrices_group.append(os.path.join("./public/data", file))

with open('./public/data/flow_list.csv', 'w') as csvFile:
    writer = csv.writer(csvFile,delimiter = ',')
    header = ['title']

    writer.writerow(header)
    for file in os.listdir('./public'):

        if file.startswith('flow_data_'):


            writer.writerow([file])
    csvFile.close()


for flow_matrices in flow_matrices_group:

    myfile = omx.open_file(flow_matrices)
    splitFileName = flow_matrices.split('_')
    flow_data_dir = 0;
    if(len(splitFileName)>3):
        flow_data_dir = './public/flow_data_'+splitFileName[2]+'_'+splitFileName[3]+'_'+splitFileName[4].split('.')[0]


        #create the folder if not exist
        if not os.path.exists(flow_data_dir):
            os.makedirs(flow_data_dir)
            lookUpTable = myfile.mapping('zone number')
            inverted_LUT = dict([[v,k] for k,v in lookUpTable.items()])
            zoneLatLongDict = {}
            indexLatLongDict = {}

            with open('./public/data/ZonesCoordinates.csv',mode = 'r') as infile:
                read = csv.reader(infile)
                zoneLatLongDict = {rows[0]:[rows[1],rows[2]]for rows in read}

                #print(zoneLatLongDict['101'])
            # for key,value in inverted_LUT.items():
            #     print(key,value,zoneLatLongDict[str(value)])

            #indexLatLongDict = {key:json.dumps([value,zoneLatLongDict[str(value)][0],zoneLatLongDict[str(value)][1]]) for key,value in inverted_LUT.items()}
            for key,value in inverted_LUT.items():
                indexLatLongDict[key] = json.dumps([str(value),zoneLatLongDict[str(value)][0],zoneLatLongDict[str(value)][1]])
            with open(flow_data_dir+'/indexLatLongDict.csv', 'wb') as f:  # Just use 'w' mode in 3.x
                w = csv.DictWriter(f, indexLatLongDict.keys())
                w.writeheader()
                w.writerow(indexLatLongDict)

            with open(flow_data_dir+'/pecas_matrices_title.csv','wb') as pecasTitle_csvfile:
                 titleWriter = csv.writer(pecasTitle_csvfile,delimiter = ',')
                 for i in myfile.list_matrices():
                     titleWriter.writerow([i])

            for title in myfile.list_matrices():
                flow_file = myfile[title]
                header = list(range(flow_file.shape[0]))
                with open(flow_data_dir+'/'+title+'.csv','wb') as csvfile:
                    spamwriter  = csv.writer(csvfile, delimiter=',')
                    spamwriter.writerow(header)
                    spamwriter.writerows(flow_file)
    else:
        print('Some flow_matrices file has a wrong format.')

    myfile.close()
# print("OMX has alread been decoded")

with open('./public/data/flow_list.csv', 'w') as csvFile:
    writer = csv.writer(csvFile,delimiter = ',')
    header = ['title']

    writer.writerow(header)
    for file in os.listdir('./public'):

        if file.startswith('flow_data_'):


            writer.writerow([file])
    csvFile.close()
