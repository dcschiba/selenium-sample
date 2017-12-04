#!/bin/sh


readLine(){
local txt=""
local inFunc=0
local func_name=""
local func_lines=""
while read line
do
#共通ファンクション内かどうかを判定
  if (echo $line | grep '// @func(' > /dev/null) ; then
    inFunc=1;
    continue
  fi
  if (echo $line | grep '// @func_end' > /dev/null) ; then
    inFunc=0;
    continue
  fi
  #初回は共通ファンクションを飛ばす
  if [ $inFunc -eq 1 ] ; then
    continue;  
  fi

  #共通ファンクションが呼ばれたら、対応する行を読み込む
  if (echo $line | grep '// @func_call' > /dev/null) ; then
    func_name=`echo "$line" | cut -d '@' -f2 | cut -d '(' -f2 | cut -d ')' -f1`
    func_lines=`echo "$2" | sed -n "/@func($func_name)/,/@func_end/p" |sed '$d'|sed '1d'`
    txt+=`readLine "$func_lines" "$2"`
  fi
#テスト対象のプログラム
  if (echo $line | grep 't.describe(' > /dev/null) ; then
    txt+="## "
    txt+=`echo $line | cut -d "'" -f2`
    txt+="\n"
    txt+="|テストケース|操作内容|\n|---|---|\n"
  fi
#テストケース名
  if (echo $line | grep 't.it(' > /dev/null) ; then
    txt+="|"
    txt+=`echo  $line |sed -e "s/ + func_name + /$case_name/"| cut -d "(" -f2 |cut -d "," -f1`
    txt+="||\n"
  fi
#テストケース名を変数化した場合の救済
  if (echo $line | grep '@case' > /dev/null) ; then
    case_name=`echo $line | cut -d ":" -f2`
  fi

#テストで実施すること
  if (echo $line | grep '// @test ' > /dev/null) ; then
    txt+="||"
    txt+=`echo ${line#*// @test}`
    txt+="|\n"
  fi
done <<END
$1
END
echo `echo $txt| sed -e "s/"\'"//g"` 
}

filepath="./test_case/"
rm -f test_docs/*
mkdir -p ./test_docs
case_name=""
for file in `\find $filepath -name '*.js'`; do
  targetfile=`echo $file | cut -d "/" -f3`
  echo $targetfile
  #ファイルから必要な行だけを取得
  lines=`grep -e 't.describe(' -e 't.it(' -e '// @test ' -e '// @func' -e '// @case' $filepath/$targetfile`
  #テストケース名、オペレーションを抽出
  doc=`readLine "$lines" "$lines"`
  #ファイルに書き出し
  filename=`echo $targetfile | cut -d "." -f1`
  echo -e "$doc" >> test_docs/$filename.md
done