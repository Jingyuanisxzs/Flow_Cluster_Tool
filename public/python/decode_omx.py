import os
import openmatrix as omx
import numpy as np
import sys
import csv
#print(sys.version)
# Open an OMX file for reading only
#print('Reading myfile.omx')
myfile = omx.open_file('./public/data/flow_matrices.omx')
#print ('Shape:', myfile.shape())                 # (100,100)
#print ('Number of tables:', len(myfile))         # 3
#print ('Table names:', myfile.list_matrices())   # ['m1','m2',',m3']
#print('attributes:', myfile.list_all_attributes()) 

#list_mappings()
#for i in myfile.list_matrices():
#    print (i)


#create the folder if not exist
if not os.path.exists('./public/flow_data'):
    os.makedirs('./public/flow_data')
    lookUpTable = myfile.mapping('zone number')
    inverted_LUT = dict([[v,k] for k,v in lookUpTable.items()])
    #print (inverted_LUT) 


    with open('./public/data/pecas_matrices_title.csv','wb') as pecasTitle_csvfile:
        titleWriter = csv.writer(pecasTitle_csvfile,delimiter = ',')
        for i in myfile.list_matrices():
            titleWriter.writerow([i])
            
    for title in myfile.list_matrices():
            
        flow_file = myfile[title]
        x,y = flow_file.shape
        with open('./public/flow_data/'+title+'.csv','wb') as csvfile:
            spamwriter  = csv.writer(csvfile, delimiter=',')
            spamwriter.writerow(["i","j","matrix0"])

            for i in range(x):
                for j in range(y):
                    spamwriter.writerow([inverted_LUT[i], inverted_LUT[j],flow_file[i][j]])
            csvfile.close()
                
         
    print("Finish OMX decoding")
else:
    print("OMX has alread been decoded")

myfile.close()
