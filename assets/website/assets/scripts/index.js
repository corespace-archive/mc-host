let commandHistory = [];
        let keyUpCounter = 0;
        let keyDownCounter = 0;

        function displayTest(message) {
            $('#logfield').append($('<li class="new-entry">').text(message));
        }

        function insertAt(array, index, ...command) {
            array.splice(index, 0, ...command);
        }

        function executeCommand(socket, command) {
            if (command != null) {
                socket.emit("command", command);
                // commandHistory.push(command);
                
                if (commandHistory.length == 0) {
                    commandHistory.push(command);
                } else {
                    insertAt(commandHistory, 0, command);
                }

                $('#commandField').val("");
            } else {
                alert("Command field is empty");
            }
        }

        function sleep(delay) {
            setTimeout(() => {
                displayTest("Test Message");
                sleep(3000);
            }, delay);
        }

        $(function () {
            var socket = io();

            socket.on('joined', (msg) => {
                $('#logfield').append($('<li class="new-entry">').text(msg));
                $(".logContainer").scrollTop($(".logContainer")[0].scrollHeight);
            });

            socket.on('action_result', (msg) => {
                $('#logfield').append($('<li class="new-entry">').text(msg));
                $(".logContainer").scrollTop($(".logContainer")[0].scrollHeight);
            });

            $('#sendCommand').click(() => {
                let command = $('#commandField').val();
                executeCommand(socket, command);
            });

            $('#btn_start').click(() => {
                socket.emit("action", "start");
            });

            $('#btn_restart').click(() => {
                socket.emit("action", "restart");
            })

            $('#btn_stop').click(() => {
                socket.emit("action", "stop");
            })

            
            $(document).on("keypress", "#commandField", function(e){
                let keyUpCounter = 0;
                if(e.which == 13){
                    let command = $(this).val();
                    executeCommand(socket, command);
                }
            });

            $(document).keydown((e) => {
                if (e.which == 38) {
                    if ($('#commandField:focus')[0] != undefined) {
                        if (keyUpCounter != commandHistory.length) {
                            console.log("Key up pressed");

                            $('#commandField').val(commandHistory[keyUpCounter]);
                            keyUpCounter++;
                            keyDownCounter--;
                        } else {
                            console.log("Max count up reached");
                        }
                    }
                }
                if (e.which == 40) {
                    if ($('#commandField:focus')[0] != undefined) {
                        if (keyDownCounter != commandHistory.length) {
                            console.log("Key down pressed");

                            $('#commandField').val(commandHistory[keyDownCounter]);
                            keyDownCounter++;
                            keyUpCounter--;
                        } else {
                            console.log("Max count down reached");
                        }
                    }
                }
            });
            
        });