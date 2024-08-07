(function () {
    let firstPlayer = 'url("img/players/cross.png")';
    let secondPlayer = 'url("img/players/circle.png")';
    const firstPlayerWinnings = [], secondPlayerWinnings = [];

    function createGameBoard() {
        const sizeOfBoard = sessionStorage.getItem('sizeOfBoard');

        // Формируем основную сетку
        for (let rowOfMainBoardIndex = 0; rowOfMainBoardIndex < sizeOfBoard; rowOfMainBoardIndex++) {
            const rowOfMainBoard = document.createElement('tr');
            rowOfMainBoard.className = 'rowOfMainBoard';
            //Создаем ячейки основной сетки
            for (let mainCellIndex = 0; mainCellIndex < sizeOfBoard; mainCellIndex++) {
                const mainCell = document.createElement('td');
                mainCell.className = "mainCell";

                // А теперь формируем дочернюю сетку внутри каждой ячейки основной сетки
                const innerBoard = document.createElement('table');
                innerBoard.className = 'innerBoard';
                //её ряды
                for (let rowOfInnerBoardIndex = 0; rowOfInnerBoardIndex < sizeOfBoard; rowOfInnerBoardIndex++) {
                    const rowOfInnerBoard = document.createElement('tr');
                    rowOfInnerBoard.className = 'rowOfInnerBoard';
                    //и ячейки
                    for (let innerCellIndex = 0; innerCellIndex < sizeOfBoard; innerCellIndex++) {
                        const innerCell = document.createElement('td');
                        innerCell.className = "innerCell";
                        //добавляем ячейкам цвет фона
                        innerCell.style.backgroundColor = randomColor();
                        rowOfInnerBoard.appendChild(innerCell);     
                    }
                    innerBoard.appendChild(rowOfInnerBoard);
                }
                mainCell.appendChild(innerBoard);
                rowOfMainBoard.appendChild(mainCell);
            };
            document.querySelector('.board').appendChild(rowOfMainBoard);
        }
    }

    /* Функция окрашивает игровое поле */
    function randomColor(){
        let hue = Math.floor(Math.random() * 15) + 30;
        let color = "hsl(" + hue + ", 100%, 75%)";
        return color;
    }
    
    /* Смена игрока */
    let playerNumber = 0;
    function changeCharacter() {
        return (event.target.closest('.mainCell') === availableMainCellToMove && 
            event.target.style.backgroundImage === "") ? ++playerNumber : null;
    }

    /* Ход игрока */ 
    // Перемещаем availableMainCellToMove
    let availableMainCellToMove = null;
    function changeavailableMainCellToMovePosition() {
        const availableMainCells = Array.from(document.querySelectorAll('.mainCell'));
        const targetInnerCells = Array.from(event.target.closest('table').querySelectorAll('.innerCell'));

        // Для этого проходимся по всем ячейкам дочернего поля до ячейки, на которую нажали
        targetInnerCells.forEach(currentInnerCell => {
            // если дошли до нужной ячейки
            if (currentInnerCell === event.target) {
                // то проходимся по всем ячейкам основного поля
                availableMainCells.forEach(currentMainCell => {
                     // если нашли ячейку с тем же индексом, то ограничиваем ход ею
                    if (availableMainCells.indexOf(currentMainCell) === targetInnerCells.indexOf(currentInnerCell)) {  
                        //если в выбранной ячейке есть место для хода
                        if (Array.from(currentMainCell.querySelectorAll('.innerCell')).some((cell) => cell.style.backgroundImage === "")) {
                            availableMainCellToMove = currentMainCell;
                        } else {
                            // Получаем ячейки, в которых осталось место для хода
                            const emptyCells = Array.from(availableMainCells).filter((cell) => Array.from(cell.querySelectorAll('.innerCell')).some((innerCell) => 
                                innerCell.style.backgroundImage === ""));
                            //И выбираем любую
                            const randomIndex = Math.floor(Math.random() * emptyCells.length);
                            //теперь эта ячейка - область для хода
                            availableMainCellToMove = emptyCells[randomIndex];
                        }
                        availableMainCellToMove.style.boxShadow = '0 0 5px 5px #ff719e';
                    } 
                })
            }
        })
    }
    
    //Делаем ход
    function makeAMove() {
        const popupIfPlayerWin = document.querySelector('.popup');
        const player = changeCharacter();

        if (event.target.className === "innerCell" && event.target.style.backgroundImage === "") {  
            //Проверяем пустое ли поле 
            const boardIsEmpty = Array.from(document.querySelectorAll('.innerCell')).every((cell) => cell.style.backgroundImage === "");
            if (boardIsEmpty) {
                //если пустое, то ходить можно в любом месте поля
                event.target.style.backgroundImage = firstPlayer;
            } else {
                 //Если не пустое, то игрок должен ходить именно в выделенной ячейке
                if (event.target.closest('.mainCell') === availableMainCellToMove) {
                    event.target.style.backgroundImage = (player % 2 === 0) ? firstPlayer : secondPlayer;
                    availableMainCellToMove.style.boxShadow = 'none';
                } else return null; // иначе ничего не произойдет
            }
            document.querySelector('.cross-or-circle').classList.toggle('circle');

            //Проверяем победил ли кто-то
            const win = checkIfWin(); 
            (win) ? popupIfPlayerWin.classList.toggle('shown') : changeavailableMainCellToMovePosition();
        }  
    }

    /* Победа */
    function checkIfWin() {
        const popupIfPlayerWin = document.querySelector('.popup');

        const rows = checkIfWinRows();
        const columns = checkIfWinColumn();
        const diagonal = checkIfWinDiagonal();
        const noEmptyCellsLeft = compareAmountOfPlayersWinnings();

        popupIfPlayerWin.querySelector('span').textContent = (rows || columns || diagonal || noEmptyCellsLeft.firstPlayerIsAWinner
            || noEmptyCellsLeft.secondPlayerIsAWinner) 
        //если один из игроков победил
        ? (event.target.style.backgroundImage === firstPlayer || noEmptyCellsLeft.firstPlayerIsAWinner) ? 'First player is a winner!' : 'Second player is a winner!' 
        //ничья
        : `It's a draw!`;

        return rows || columns || diagonal || noEmptyCellsLeft.firstPlayerIsAWinner
        || noEmptyCellsLeft.secondPlayerIsAWinner || noEmptyCellsLeft.draw;
    }

    //Функция находит индексы ячеек, на которые нажали 
    function findEventTargetIndex(targetMainCellIndex = null, targetInnerCellIndex = null) {
        const targetInnerCell = event.target;

        //Определяем индекс основной ячейки (targetMainCellIndex):
        //проходимся по рядам основной сетки
        document.querySelectorAll('.rowOfMainBoard').forEach(currentMainRow => {
            //из каждого ряда берем ячейки
            const eachMainRowCells = Array.from(currentMainRow.querySelectorAll('.mainCell'));
            //находим основную ячейку, на которую нажали и определяем её индекс
            if (eachMainRowCells.includes(targetInnerCell.closest('.mainCell'))) {
                targetMainCellIndex = eachMainRowCells.indexOf(targetInnerCell.closest('.mainCell'))
            }
        })

        //Определяем индекс дочерней ячейки (targetInnerCellIndex):
        //проходимся по ячейкам основной сетки
        document.querySelectorAll('.mainCell').forEach(currentMainCell => {
            //из каждой основной ячейки берем ряды дочерней
            const innerRows = currentMainCell.querySelectorAll('.rowOfInnerBoard');
            innerRows.forEach(currentInnerRow => {
                //и из них берем ячейки дочерней сетки
                const innerRowCells = Array.from(currentInnerRow.querySelectorAll('.innerCell'));
                innerRowCells.forEach(currentRowCell => {
                    if (currentRowCell === event.target) {
                        targetInnerCellIndex = innerRowCells.indexOf(currentRowCell);
                    }
                })
            })
        })

        return {
            targetMainCellIndex,
            targetInnerCellIndex
        }
    }

    //Ряды
    function checkIfWinRows(wholeBoardRow = []) {
        const targetMainRowCells = event.target.closest('.rowOfMainBoard').querySelectorAll('.mainCell');
        const targetInnerRow = event.target.closest('.rowOfInnerBoard');
        wholeBoardRow.push(targetInnerRow);

        //Проходимся по основным ячейкам ряда, на который нажали
        for (let currentMainCellIndex = 0; currentMainCellIndex < targetMainRowCells.length; currentMainCellIndex++) {
            //и из каждой ячейки берем ряды дочерней сетки
            const currentMainCellInnerRows = targetMainRowCells[currentMainCellIndex].querySelectorAll('.rowOfInnerBoard');
            //затем берем все ячейки, кроме той, на которую нажали
            const anotherMainCells = 
                Array.from(targetMainRowCells).filter((cell) => cell !== 
                event.target.closest('.mainCell'));

            //Проходимся по ячейкам anotherMainCells
            for (let anotherMainCellIndex = 0; anotherMainCellIndex < anotherMainCells.length; anotherMainCellIndex++) {
                //из каждой ячейки берем ряды
                const anotherMainCellsInnerRows = anotherMainCells[anotherMainCellIndex].querySelectorAll('.rowOfInnerBoard');
                //Проходимся по рядам currentMainCellInnerRows
                for (let currentRowIndex = 0; currentRowIndex < currentMainCellInnerRows.length; currentRowIndex++) {
                    if (currentMainCellInnerRows[currentRowIndex] === targetInnerRow) {
                        //Проходимся по рядам anotherMainCells
                        for (let anotherRowIndex = 0; anotherRowIndex < anotherMainCellsInnerRows.length; anotherRowIndex++) {
                            //если индекс ряда идентичен targetInnerRow, то добавляем в массив
                            if (anotherRowIndex === currentRowIndex) {
                                wholeBoardRow.push(anotherMainCellsInnerRows[anotherRowIndex]);
                            }
                        }
                    }
                }
            }
        }
        //Получаем все ячейки wholeBoardRow
        const allCellsRow = [];
        wholeBoardRow.forEach(innerRow => {
            const innerRowCells = innerRow.querySelectorAll('.innerCell');
            innerRowCells.forEach(cell => allCellsRow.push(cell));
        })

        return (allCellsRow.every((cell) => cell.style.backgroundImage === firstPlayer) || 
            (allCellsRow.every((cell) => cell.style.backgroundImage === secondPlayer)));
    }

    //Столбцы
    function checkIfWinColumn(wholeBoardColumn = []) {
        const targetIndex = findEventTargetIndex();

        document.querySelectorAll('.rowOfMainBoard').forEach(currentMainRow => {
            const eachMainRowCells = Array.from(currentMainRow.querySelectorAll('.mainCell'));
            //добавляем в массив все ячейки с индексом targetMainCellIndex, чтобы создать целую вертикальную строку
            for (let mainCellIndex = 0; mainCellIndex < eachMainRowCells.length; mainCellIndex++) {
                wholeBoardColumn.push(eachMainRowCells[targetIndex.targetMainCellIndex]);
            }
        })

        let allInnerCellsColumn = [];
        wholeBoardColumn.forEach(currentMainCell => {
            //из каждой основной ячейки берем ряды дочерней
            const innerRows = currentMainCell.querySelectorAll('.rowOfInnerBoard');
            innerRows.forEach(currentInnerRow => {
                //и из них берем ячейки дочерней сетки
                const innerRowCells = Array.from(currentInnerRow.querySelectorAll('.innerCell'));
                for (let innerRowCellIndex = 0; innerRowCellIndex < innerRowCells.length; innerRowCellIndex++) {
                    allInnerCellsColumn.push(innerRowCells[targetIndex.targetInnerCellIndex]);
                }
            })
        })

        const checkIfWinMainColumn =  (allInnerCellsColumn.every((cell) => cell.style.backgroundImage === firstPlayer) || 
        (allInnerCellsColumn.every((cell) => cell.style.backgroundImage === secondPlayer)))

        return checkIfWinMainColumn;
    }

    //по диагонали
    function checkIfWinDiagonal(ascendingDiagonal = [], descendingDiagonal = []) {
        const mainRowsOfBoard = document.querySelectorAll('.rowOfMainBoard');
        const boardSize = sessionStorage.getItem('sizeOfBoard');

        // Проверяем нисходящую диагональ
        for (let i = 0; i < boardSize; i++) {
            // Получаем диагональ основной сетки 
            const mainCell = mainRowsOfBoard[i].querySelectorAll('.mainCell')[i];
            // Получаем диагональ внутренней сетки
            const innerDiagonal = getInnerDiagonal(mainCell, true); // передаем true для нисходящей диагонали 
            // Добавляем диагональ внутренней сетки в массив
            descendingDiagonal.push(...innerDiagonal);
        }

        // Проверяем восходящую диагональ
        for (let i = 0; i < boardSize; i++) {
            const mainCell = mainRowsOfBoard[i].querySelectorAll('.mainCell')[boardSize - 1 - i];
            // Получаем диагональ внутренней сетки
            const innerDiagonal = getInnerDiagonal(mainCell, false); // передаем false для восходящей диагонали
            // Добавляем диагональ внутренней сетки в массив
            ascendingDiagonal.push(...innerDiagonal);
        }

       return (descendingDiagonal.every((cell) => cell.style.backgroundImage === firstPlayer || 
            (descendingDiagonal.every((cell) => cell.style.backgroundImage === secondPlayer)))) 
            
        || (ascendingDiagonal.every((cell) => cell.style.backgroundImage === firstPlayer || 
        (ascendingDiagonal.every((cell) => cell.style.backgroundImage === secondPlayer))));
    }

    // Получение диагонали внутренней сетки
    function getInnerDiagonal(mainCell, isDescending) {
        const innerDiagonal = [];
        const innerBoard = mainCell.querySelector('.innerBoard');
        const innerRows = innerBoard.querySelectorAll('.rowOfInnerBoard');

        if (isDescending) {
            // Нисходящая диагональ
            for (let innerRowIndex = 0; innerRowIndex < innerRows.length; innerRowIndex++) {
                const innerCell = innerRows[innerRowIndex].querySelectorAll('.innerCell')[innerRowIndex];
                innerDiagonal.push(innerCell);
            }
        } else {
            // Восходящая диагональ
            for (let innerRowIndex = 0; innerRowIndex < innerRows.length; innerRowIndex++) {
                const innerCell = innerRows[innerRowIndex].querySelectorAll('.innerCell')[innerRows.length - 1 - innerRowIndex];
                innerDiagonal.push(innerCell);
            }
        }

        return innerDiagonal;
    }

    //Функция считает победы игроков в дочерних полях (полях внутри ячеек)
    function countWinningsOfPlayersInnerCells() {
        const targetInnerRow = event.target.closest('.rowOfInnerBoard');
        const targetMainCell = event.target.closest('.mainCell');
        const targetMainCellInnerRows = targetMainCell.querySelectorAll('.rowOfInnerBoard');
      
        /* Если в ячейке уже одержал победу один из игроков, 
        то даже если другой игрок также достигнет победы в этой ячейке (например, выстроит крестики в ряд),
        это не будет засчитано. */
        if (firstPlayerWinnings.includes(targetMainCell) || secondPlayerWinnings.includes(targetMainCell)) {
            return { firstPlayerWinnings, secondPlayerWinnings };
        }
      
        //Проверяем ряд
        const isRowWin = (player) => {
            return Array.from(targetInnerRow.querySelectorAll('.innerCell'))
                .every((cell) => cell.style.backgroundImage === player);
        };
      
        //проверяем диагонали (восходящую и нисходящую)
        const isDiagonalWin = (player) => {
            //для этого собираем ячейки по диагонали
            const ascendingDiagonal = Array.from(targetMainCellInnerRows)
                .map((row, innerCellIndex) => row.querySelectorAll('.innerCell')[innerCellIndex]);
            const descendingDiagonal = Array.from(targetMainCellInnerRows)
                .map((row, innerCellIndex) => row.querySelectorAll('.innerCell')[targetMainCellInnerRows.length - 1 - innerCellIndex]);
      
            //а после этого проверяем диагонали на победу
            return ascendingDiagonal.every((cell) => cell.style.backgroundImage === player) ||
                descendingDiagonal.every((cell) => cell.style.backgroundImage === player);
        };
      
        //проверяем столбец
        const isColumnWin = (player) => {
            const targetIndex = findEventTargetIndex();
            //собираем ячейки с индексом, как у той, на которую нажали
            const column = Array.from(targetMainCellInnerRows)
                .map((row) => row.querySelectorAll('.innerCell')[targetIndex.targetInnerCellIndex]);
            
            return column.every((cell) => cell.style.backgroundImage === player);
        };
      
        //если в ячейке победил первый игрок
        if (isRowWin(firstPlayer) || isDiagonalWin(firstPlayer) || isColumnWin(firstPlayer)) {
            firstPlayerWinnings.push(targetMainCell);
        //если победил второй игрок
        } else if (isRowWin(secondPlayer) || isDiagonalWin(secondPlayer) || isColumnWin(secondPlayer)) {
            secondPlayerWinnings.push(targetMainCell);
        }
      
        return { 
            firstPlayerWinnings, 
            secondPlayerWinnings 
        };
    }

    //Функция определяет победителя по количеству этих побед
    function compareAmountOfPlayersWinnings() {
        const amountOfPlayersWinnings = countWinningsOfPlayersInnerCells();
        const noEmptyCellsLeft = Array.from(document.querySelectorAll('.innerCell')).every((cell) => cell.style.backgroundImage !== "");

        const firstPlayerIsAWinner = (noEmptyCellsLeft && amountOfPlayersWinnings.firstPlayerWinnings.length > amountOfPlayersWinnings.secondPlayerWinnings.length);
        const secondPlayerIsAWinner = (noEmptyCellsLeft && amountOfPlayersWinnings.firstPlayerWinnings.length < amountOfPlayersWinnings.secondPlayerWinnings.length);
        const draw = (noEmptyCellsLeft && amountOfPlayersWinnings.firstPlayerWinnings.length === amountOfPlayersWinnings.secondPlayerWinnings.length);

        return {
            firstPlayerIsAWinner,
            secondPlayerIsAWinner,
            draw
        }
    } 

    document.addEventListener('DOMContentLoaded', () => {

        //Поле помещаем сразу при загрузке страницы
        createGameBoard();

        //При нажатии на ячейку будет сделан ход
        const board = document.querySelector('.board');
        board.addEventListener('click', (event) => {
            event.preventDefault();
            makeAMove();
        });

        const restartButton = document.querySelector('#restart');
        restartButton.addEventListener('click', () => {
            location.reload();
        })

        const closeButton = document.querySelector('#leave');
        closeButton.addEventListener('click', () => {
            location.href = "index.html";
        })
    });
}) ()