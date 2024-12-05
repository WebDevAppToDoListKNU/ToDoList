import React, { useState, useEffect } from "react";
import axios from "axios";
import { chat } from './openai';
import { useNavigate } from 'react-router-dom';


function ToDoList() {


    const navigate = useNavigate();
    const [logInUser, setLogInUser] = useState(null);
    const [todos, setTodos] = useState({});
    const [folders, setFolders] = useState([]);

    const [favorites, setFavorites] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(1);
    const [editorOpen, setEditorOpen] = useState(false);
    const [edit, setEdit] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [newFolderName, setNewFolderName] = useState("");
    const [query, setQuery] = useState("");
    const [summary, setSummary] = useState("");
    const [sortOrder, setSortOrder] = useState("latest");
    const [filterDate, setFilterDate] = useState("");


    useEffect(() => {
        const userId = sessionStorage.getItem("logInUserId");
        if (userId) {
            axios.get(`http://localhost:8000/users/${userId}`)
                .then((response) => {
                    setLogInUser(response.data);
                    setTodos(response.data.todos || {});
                    setFolders(response.data.folders || []);
                    setFavorites(response.data.favorites || []);
                })
                .catch((error) => {
                    console.error("로딩실패", error);
                });
        }
    }, []);

    const updateFavorite = (updatedFavorites) => {
        const userId = logInUser?.id;
        axios.patch(`http://localhost:8000/users/${userId}`, { favorites: updatedFavorites })
            .then(() => {
                console.log("즐찾 업데이트");
            })
            .catch((error) => {
                console.error("즐찾 실패, ", error);
            });
    };

    const onLogout = () => {
        sessionStorage.removeItem("logInUserId");
        setLogInUser(null);
        navigate("/");
    };

    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const date = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");

        return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
    };


    const onAddOrUpdate = () => {
        if (title.trim() === "" || content.trim() === "") {
            alert("제목과 내용을 입력하세요!");
            return;
        }
        const folderTodos = todos[selectedFolder] || [];
        const userId = logInUser?.id;

        
        const folderId = selectedFolder;  

        if (edit) {
            const updatedTodos = folderTodos.map((todo) =>
                todo.id === edit.id ? { ...todo, title, content, date: filterDate, folderId } : todo
            );
            const updatedData = { ...todos, [selectedFolder]: updatedTodos };
            setTodos(updatedData);

            
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: updatedData })
                .then(() => console.log("업데이트 성공"))
                .catch((error) => console.error("업데이트 에러발생, ", error));
        } else {
            const id = folderTodos.length > 0 ? folderTodos[folderTodos.length - 1].id + 1 : 1;
            const newTodo = { id, title, content, date: getCurrentDate(), folderId };
            const updatedData = { ...todos, [selectedFolder]: [...folderTodos, newTodo] };
            setTodos(updatedData);

            axios.patch(`http://localhost:8000/users/${userId}`, { todos: updatedData })
                .then(() => console.log("메모 쓰기 성공"))
                .catch((error) => console.error("메모 쓰기 실패, ", error));
        }
        closeEditor();
    };




    const addFolder = () => {
        if (!logInUser) {
            alert("로그인 후 폴더를 추가할 수 있습니다.");
            return;
        }
        if (newFolderName.trim()) {
            const id = folders.length > 0 ? folders[folders.length - 1].id + 1 : 1;
            const newFolder = { id, name: newFolderName.trim() };
            const updatedFolders = [...folders, newFolder];
            setFolders(updatedFolders);
            setNewFolderName("");

        
            const userId = logInUser?.id;
            axios.patch(`http://localhost:8000/users/${userId}`, { folders: updatedFolders })
                .then(() => console.log("새폴더 추가 성공"))
                .catch((error) => console.error("폴더추가 실패, ", error));
        }
    };


    const onDelete = (id) => {
        const folderTodos = todos[selectedFolder];
        const updatedTodos = folderTodos.filter((todo) => todo.id !== id);
        const todoDelete = folderTodos.find((todo) => todo.id === id);

        const updatedData = { ...todos, [selectedFolder]: updatedTodos };
        setTodos(updatedData);

        //id 충돌 방지ㅣ용~
        if (todoDelete) {
            const allTodos = Object.values(todos).flat();
            const newId = Math.max(0, ...allTodos.map((todo) => todo.id)) + 1;

            const trashTodos = [
                ...(todos[1] || []),
                { ...todoDelete, id: newId, preFolder: selectedFolder }
            ];
            setTodos((prev) => ({ ...prev, 1: trashTodos }));

            const userId = logInUser?.id;
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: { ...updatedData, 1: trashTodos } })
                .then(() => console.log("휴지통 이동 성공"))
                .catch((error) => console.error("휴지통 이동 실패, ", error));
        }
    };



    const onRealDelete = (id) => {
        const trashTodos = todos[TRASH_FOLDER_ID];
        const updatedTodos = trashTodos.filter((todo) => todo.id !== id);

        setTodos((prevState) => ({
            ...prevState,
            [TRASH_FOLDER_ID]: updatedTodos,
        }));

        
        const userId = logInUser?.id;
        axios
            .patch(`http://localhost:8000/users/${userId}`, {
                todos: {
                    ...todos,
                    [TRASH_FOLDER_ID]: updatedTodos,
                },
            })
            .then(() => {
                console.log("완전삭제 성공");
            })
            .catch((error) => {
                console.error("완전삭제 실패, ", error);
            });
    };



    const TRASH_FOLDER_ID = 1;
//복원로직임
    const restoreTodo = (id) => {
        const trashTodos = todos[TRASH_FOLDER_ID];
        const todoRestore = trashTodos.find((todo) => todo.id === id);
        const updatedTrashTodos = trashTodos.filter((todo) => todo.id !== id);

        if (todoRestore) {
            const restoredFolder = todoRestore.preFolder;
            const updatedFolderTodos = [...(todos[restoredFolder] || []), { ...todoRestore, preFolder: undefined }];

            
            const updatedData = {
                ...todos,
                [TRASH_FOLDER_ID]: updatedTrashTodos,
                [restoredFolder]: updatedFolderTodos
            };
            setTodos(updatedData);


            const userId = logInUser?.id;
            axios.patch(`http://localhost:8000/users/${userId}`, { todos: updatedData })
                .then(() => console.log("복원성공"))
                .catch((error) => console.error("복원실패, ", error));
        }
    };


    const toggleFavorite = (todoId, folderId) => {
        const isFavorite = favorites.some((item) => item.todoId === todoId && item.folderId === folderId);

        let updatedFavorites;
        if (isFavorite) {
            updatedFavorites = favorites.filter((item) => item.todoId !== todoId || item.folderId !== folderId);
        } else {
            updatedFavorites = [...favorites, { todoId, folderId }];
        }

        setFavorites(updatedFavorites);
        updateFavorite(updatedFavorites); 
    };



    const openEditor = (todo = null) => {
        if (!logInUser) {
            alert("로그인 후 이용할 수 있습니다.");
            return;
        }
        setEditorOpen(true);
        if (todo) {
            setEdit(todo);
            setTitle(todo.title);
            setContent(todo.content);
            setFilterDate(todo.date);
        } else {
            setEdit(null);
            setTitle("");
            setContent("");
            setFilterDate("");
        }
    };

    const closeEditor = () => {
        setEditorOpen(false);
        setEdit(null);
        setTitle("");
        setContent("");
        setSummary("");
        setFilterDate("");
    };

    const sortTodos = (todos) => {
        return todos.sort((a, b) =>
            sortOrder === "latest"
                ? new Date(b.date) - new Date(a.date)
                : new Date(a.date) - new Date(b.date)
        );
    };

    const filteredTodos = sortTodos(
        (todos[selectedFolder] || []).filter(
            (todo) =>
                (!filterDate || todo.date === filterDate) &&
                (todo.title.toLowerCase().includes(query.toLowerCase()) ||
                    todo.content.toLowerCase().includes(query.toLowerCase()))
        )
    );

    const fetchSummary = () => {
        const prompt = `다음은 사용자가 작성한 TodoList입니다. 내용을 간결하고, 가독성 있게 정리해주세요.
        ${content}`;

        chat(prompt, (response) => setSummary(response));
    };

    const updateTodoContent = () => {
        setContent(summary);
    };

    const onDeleteFolder = (folderId) => {
        if (folderId === 1) {
            alert("휴지통 폴더는 삭제할 수 없습니다.");
            return;
        }

        const updatedFolders = folders.filter((folder) => folder.id !== folderId);
        const updatedTodos = { ...todos };

        delete updatedTodos[folderId];
        setFolders(updatedFolders);
        setTodos(updatedTodos);

        const userId = logInUser?.id;
        axios.patch(`http://localhost:8000/users/${userId}`, {
            folders: updatedFolders,
            todos: updatedTodos,
        })
            .then(() => console.log("폴더삭제 완"))
            .catch((error) => console.error("폴더삭제 실패, ", error));
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            <div
                style={{
                    width: "250px",
                    borderRight: "2px solid #ccc",
                    padding: 10,
                    boxSizing: "border-box",
                }}
            >
                <h2>ToDoList</h2>
                {logInUser && (
                    <p>안녕하세요, {logInUser.userId}님!</p>
                )}
                {logInUser ? (
                    <button onClick={onLogout}
                        style={{ marginRight: 15 }}>로그아웃</button>
                ) : (
                    <button onClick={() => navigate("/login")}
                        style={{ marginRight: 15 }}>로그인</button>
                )}

                {selectedFolder !== 1 && (<button
                    onClick={() => openEditor()}>
                    메모 쓰기
                </button>)}

                <ul style={{ listStyle: "none", padding: 0 }}>
                    {logInUser ? (
                        folders.map((folder) => (
                            <li
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                style={{
                                    display: "flex",       
                                    justifyContent: "space-between", 
                                    alignItems: "center",    
                                    fontWeight: selectedFolder === folder.id ? "bold" : "normal",
                                    backgroundColor: selectedFolder === folder.id ? "#e0e0e0" : "transparent",
                                    padding: "5px",
                                    borderRadius: "4px",
                                }}
                            >
                                <span>{folder.name}</span> 

    
                                {folder.id !== 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteFolder(folder.id);
                                        }}>
                                        삭제
                                    </button>
                                )}
                            </li>
                        ))
                    ) : (
                        <p>로그인 후 폴더를 볼 수 있습니다.</p>
                    )}
                </ul>


                <div>
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="새 폴더 이름"
                        style={{ marginRight: 10 }}
                    />
                    <button onClick={addFolder}>폴더 추가</button>
                </div>
                {logInUser && selectedFolder !== 1 && (
                    <h3>
                        {folders.find((folder) => folder.id === selectedFolder)?.name} 폴더 즐겨찾기
                    </h3>
                )}
                {logInUser &&
                    favorites.map(({ todoId, folderId }) => {
                        if (folderId !== selectedFolder || folderId === 1) return null;

                        const note = todos[selectedFolder]?.find((todo) => todo.id === todoId);
                        return note ? (
                            <div key={todoId} onClick={() => openEditor(note)}>
                                {note.title}
                            </div>
                        ) : null;
                    })}


            </div>

            {/* 메모 영역------------------------------------------------ */}
            <div style={{ flex: 1, padding: 20 }}>
                <h2>{folders.find((folder) => folder.id === selectedFolder)?.name}</h2>
                <div>



                    <input
                        type="text"
                        placeholder="검색 (제목/내용)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: "30%",
                            padding: 10,
                            marginBottom: 20,
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                <div style={{ marginBottom: 15 }}>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{ marginRight: 10 }}

                    />
                    <button onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}>
                        {sortOrder === "latest" ? "최신순" : "오래된 순"}
                    </button>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: 20,
                    }}
                >
                    {logInUser ? (
                        filteredTodos.map((todo) => (
                            <div
                                key={todo.id}
                                style={{
                                    border: "1px solid #ccc",
                                    borderRadius: 10,
                                    padding: 10,
                                    backgroundColor: "white",
                                }}
                            >
                                <h3
                                    onClick={() => openEditor(todo)}>
                                    {todo.title}
                                </h3>
                                <p style={{ fontSize: 14, color: "#555" }}>
                                    {todo.content.length > 20 ? todo.content.slice(0, 20) + '...' : todo.content}
                                </p>


                                <p>{todo.date}</p>

                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                    {selectedFolder !== 1 && (
                                        <button onClick={() => toggleFavorite(todo.id, todo.folderId)}>
                                            {favorites.some((item) => item.todoId === todo.id && item.folderId === todo.folderId) ? "★" : "☆"}
                                        </button>)}
                                    {selectedFolder !== 1 && (
                                        <button onClick={() => onDelete(todo.id)}>
                                            삭제
                                        </button>
                                    )}
                                </div>



                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                                    {selectedFolder === 1 && (
                                        <button
                                            onClick={() => restoreTodo(todo.id)}>
                                            복원
                                        </button>
                                    )}
                                    {selectedFolder === 1 && (
                                        <button onClick={() => onRealDelete(todo.id)}>
                                            완전 삭제
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>로그인 후 메모를 확인할 수 있습니다.</p>
                    )}

                </div>
            </div>

            {editorOpen && (
                <div
                    style={{
                        position: "fixed",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                    <div
                        style={{
                            backgroundColor: "white",
                            width: "50%",
                            height: "50%",
                            borderRadius: 10,
                        }}>
                        <button
                            onClick={closeEditor}>
                            ✕
                        </button>
                        <div style={{ padding: 10 }}>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목 입력"
                                style={{
                                    width: "100%",
                                    padding: 10,
                                    fontSize: 16,
                                    boxSizing: "border-box",
                                    marginBottom: 10,
                                }}
                            />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="내용 입력"
                                style={{
                                    width: "100%",
                                    height: 200,
                                    padding: 10,
                                    fontSize: 16,
                                    boxSizing: "border-box",
                                }}
                            ></textarea>

                            <button
                                onClick={fetchSummary}>
                                GPT 내용 요약
                            </button>
                            {summary && (
                                <div>
                                    <p>{summary}</p>
                                    <button
                                        onClick={updateTodoContent}>
                                        변경하기
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={onAddOrUpdate}>
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ToDoList;

