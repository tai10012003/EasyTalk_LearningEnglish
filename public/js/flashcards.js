document
  .getElementById("newFlashcardListForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Lấy dữ liệu từ form
    const name = document.getElementById("listName").value;
    const description = document.getElementById("listDescription").value;

    // Gửi yêu cầu POST đến server
    fetch("/flashcards/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        description: description,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Tạo FlashcardList thành công!");

          // Sau khi thành công, có thể đóng modal và reset form
          const modal = bootstrap.Modal.getInstance(
            document.getElementById("createNewListModal")
          );
          modal.hide();

          // Reset form
          document.getElementById("newFlashcardListForm").reset();

          // Cập nhật danh sách flashcard nếu cần
          // Thêm flashcardlist vào giao diện hoặc reload trang
        } else {
          alert("Có lỗi xảy ra: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  
  
