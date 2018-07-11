#this file is useless. Can be deleted
import openmatrix as omx
import numpy as np
import sys
#print(sys.version)
# Open an OMX file for reading only
#print('Reading myfile.omx')
myfile = omx.open_file('./public/data/flow_matrices.omx')
#print ('Shape:', myfile.shape())                 # (100,100)
#print ('Number of tables:', len(myfile))         # 3
#print ('Table names:', myfile.list_matrices())   # ['m1','m2',',m3']
#print('attributes:', myfile.list_all_attributes()) 


for i in myfile.list_matrices():
    fileurl = "./public/flow_data/"+i+".csv"
#Open CSV file
    with open(fileurl, "r+") as f:
        #Open file which has header
        with open("./public/data/header.txt",'r') as fh:
            #Read header
            header = fh.read()
            #Read complete data of CSV file
            old = f.read()
            #Get cursor to start of file
            f.seek(0)
            #Write header and old data to file.
            f.write(header + old)

myfile.close()
