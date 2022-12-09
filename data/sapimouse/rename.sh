for i in `seq 1 120`;
  do
    cd user${i}
    mv session_*_3min.csv session_3min.csv
    mv session_*_1min.csv session_1min.csv
    cd ../
done