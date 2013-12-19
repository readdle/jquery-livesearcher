<?php

$users = array();
$u = rand(5,30);

for($i = 0; $i < $u; $i++) {
    $users[] = array(
        'id' => rand(1,150),
        "title" => "User $i",
        "additional-field" =>  "additional-data-".rand(1,9999),
        'color' => rand(1,2)
    );
}

sleep(1/rand(2,4));

echo json_encode($users);