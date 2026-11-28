<?php

test('the health check returns a successful response', function () {
    $this->get('/up')->assertStatus(200);
});
