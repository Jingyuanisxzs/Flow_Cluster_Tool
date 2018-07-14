import os
import openmatrix as omx
import numpy as np
import sys
import csv
import json
from StringIO import StringIO
#print(sys.version)
# Open an OMX file for reading only
#print('Reading myfile.omx')
io = StringIO()
myfile = omx.open_file('./public/data/flow_matrices.omx')
#print ('Shape:', myfile.shape())                 # (100,100)
#print ('Number of tables:', len(myfile))         # 3
#print ('Table names:', myfile.list_matrices())   # ['m1','m2',',m3']
#print('attributes:', myfile.list_all_attributes()) 

#list_mappings()
#for i in myfile.list_matrices():
#    print (i)
def WriteDictToCSV(csv_file,csv_columns,dict_data):
    try:
        with open(csv_file, 'w') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=csv_columns)
            writer.writeheader()
            for data in dict_data:
                writer.writerow(data)
    except IOError as (errno, strerror):
            print("I/O error({0}): {1}".format(errno, strerror))    
    return    

#create the folder if not exist
if not os.path.exists('./public/flow_data'):
    os.makedirs('./public/flow_data')
    lookUpTable = myfile.mapping('zone number')
    inverted_LUT = dict([[v,k] for k,v in lookUpTable.items()])
    zoneLatLongDict = {}
    indexLatLongDict = {}
    #print (inverted_LUT) 
    if not os.path.exists('./public/data/LUT.csv'):
        with open('./public/data/ZonesCoordinates.csv',mode = 'r') as infile:
            read = csv.reader(infile)
            zoneLatLongDict = {rows[0]:[rows[1],rows[2]]for rows in read}
    
            #print(zoneLatLongDict['101'])
        # for key,value in inverted_LUT.items():
        #     print(key,value,zoneLatLongDict[str(value)])

        #indexLatLongDict = {key:json.dumps([value,zoneLatLongDict[str(value)][0],zoneLatLongDict[str(value)][1]]) for key,value in inverted_LUT.items()}
        for key,value in inverted_LUT.items():
            indexLatLongDict[key] = json.dumps([str(value),zoneLatLongDict[str(value)][0],zoneLatLongDict[str(value)][1]])
        with open('./public/data/indexLatLongDict.csv', 'wb') as f:  # Just use 'w' mode in 3.x
            w = csv.DictWriter(f, indexLatLongDict.keys())
            w.writeheader()
            w.writerow(indexLatLongDict)
    
    with open('./public/data/pecas_matrices_title.csv','wb') as pecasTitle_csvfile:
         titleWriter = csv.writer(pecasTitle_csvfile,delimiter = ',')
         for i in myfile.list_matrices():
             titleWriter.writerow([i])
    
    for title in myfile.list_matrices():
        flow_file = myfile[title]
        header = list(range(flow_file.shape[0]))
        with open('./public/flow_data/'+title+'.csv','wb') as csvfile:
            spamwriter  = csv.writer(csvfile, delimiter=',')
            spamwriter.writerow(header)
            spamwriter.writerows(flow_file)
    
         
    print("Finish OMX decoding")
else:
    print("OMX has alread been decoded")

myfile.close()
