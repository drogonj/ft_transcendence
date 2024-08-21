#!/bin/bash
# failover_script.sh

NODE_ID=$1
OLD_PRIMARY=$2
NEW_PRIMARY=$3
PORT=$4
REPLICA_ID=$5
REPLICA_HOST=$6

echo "Failover detected. Promoting $NEW_PRIMARY to primary."
# Promote new primary
pg_ctl promote -D /path/to/data_directory -D $NEW_PRIMARY
