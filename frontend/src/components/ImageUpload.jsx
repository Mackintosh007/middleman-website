import { useState } from "react";
import api from "../api/axios";

function ImageUpload({ propertyId }) {
  const [loading, setLoading] = useState(false);

  const uploadImage = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      setLoading(true);
      await api.post(`/images/${propertyId}`, {
        image: reader.result,
      });
      setLoading(false);
      alert("Image uploaded");
    };
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={uploadImage} />
      {loading && <p>Uploading...</p>}
    </div>
  );
}

export default ImageUpload;
