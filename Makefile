#
# Flow_Cluster_Tool/Makefile ---
#

ifeq (${FCT_DIR},)
  $(error source ./fct-setup.env)
endif

#####

SHELL:=bash
.SUFFIXES:

_default:

#####

ifeq (${FCT_UNAME},Linux)
_apt_get_install:
	sudo apt-get install npm
endif

ifeq (${FCT_UNAME},Darwin)
_brew_install:
	brew install npm 
endif

#####

# @todo use python3
sys_python2.7=$(shell PATH=/usr/bin:/usr/local/bin:${PATH} type -p python2.7)
sys_virtualenv=$(shell PATH=/usr/bin:/usr/local/bin:${PATH} type -p virtualenv)

pip_exe=${FCT_VE_DIR}/bin/pip

_python_ve_build:
#
	${sys_virtualenv} --python ${sys_python2.7} ${FCT_VE_DIR}
#
	${pip_exe} install numpy openmatrix

_python_ve_rm:
	rm -rf ${FCT_VE_DIR}

_python_ve_rebuild: _python_ve_rm _python_ve_build


npm_exe=$(shell PATH=PATH=/usr/bin:/usr/local/bin:${PATH} type -p npm)

# Readme has a list, but "package.json" is a better list.
_npm_install:
	npm install

_build_all: _python_ve_build _npm_install

#####

# Grab some testing data.
# NOTE: this data needs to be renamed to have the correct scheme.
_omx_rsync_data:
	rsync -Pa \
	  --include "*/" \
	  --include "*.omx" \
	  --exclude "*" \
	  --prune-empty-dirs \
	  10.11.1.141:/Users/hba-user/ATPECAS/P107/ \
	  ${FCT_OMX_DATA_DIR}/P107/

# We want the name to be:
#   ``flow_matrices_SCENARIO_YEAR_VERSION.omx``
# For now we use a version of "_1"
# Do the rename in a couple of shell rename rules, then rsync it there.
_omx_rename_data:
	( builtin cd ${FCT_OMX_DATA_DIR} ; find . -name \*.omx ) | \
	while read omx_path ; \
	do \
	   fm_path=$${omx_path} ; \
	   fm_path=$${fm_path/\.\//} ; \
	   fm_path=$${fm_path/flow_matrices/1} ; \
	   fm_path=flow_matrices_$${fm_path//\//_} ; \
	   echo "$${omx_path} -> $${fm_path}" ; \
	   rsync -Pa $${FCT_OMX_DATA_DIR}/$${omx_path} $${FCT_DATA_DIR}/$${fm_path} ; \
	done

#####

_fct_run_server:
	./bin/fct-run-server
