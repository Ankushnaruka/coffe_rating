import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8000/api/coffees";

export default function App() {
  const [coffees, setCoffees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding a new coffee
  const [name, setName] = useState("");
  const [roast, setRoast] = useState("Medium Roast");
  const [origin, setOrigin] = useState("");

  // 1. Fetch coffees on component load
  const fetchCoffees = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      const data = await response.json();
      setCoffees(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching coffees:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoffees();
  }, []);

  // 2. Handle Voting
  const handleVote = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/vote`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedCoffee = await response.json();
        // Optimistically update the UI without doing a full refetch
        setCoffees((prevCoffees) =>
          prevCoffees
            .map((coffee) => (coffee.id === id ? updatedCoffee : coffee))
            .sort((a, b) => b.votes - a.votes) // Keep sorted by highest votes
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  // 3. Handle Adding New Coffee
  const handleAddCoffee = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, roast, origin: origin || null }),
      });

      if (response.ok) {
        const newCoffee = await response.json();
        setCoffees([...coffees, newCoffee]);
        // Reset form
        setName("");
        setOrigin("");
      }
    } catch (error) {
      console.error("Error adding coffee:", error);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>☕ Coffee Rating App</h1>

      {/* --- ADD COFFEE FORM --- */}
      <form onSubmit={handleAddCoffee} style={{ marginBottom: "30px", padding: "15px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h3>Add a New Coffee</h3>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Coffee Name (e.g. Colombian Supremo)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "95%", padding: "8px", marginBottom: "8px" }}
          />
          <input
            type="text"
            placeholder="Origin Country (Optional)"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{ width: "95%", padding: "8px", marginBottom: "8px" }}
          />
          <select
            value={roast}
            onChange={(e) => setRoast(e.target.value)}
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          >
            <option value="Light Roast">Light Roast</option>
            <option value="Medium Roast">Medium Roast</option>
            <option value="Dark Roast">Dark Roast</option>
          </select>
        </div>
        <button type="submit" style={{ padding: "8px 16px", cursor: "pointer", background: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}>
          Add Coffee
        </button>
      </form>

      {/* --- COFFEE LIST --- */}
      <h2>Top Rated Coffees</h2>
      {loading ? (
        <p>Loading coffees...</p>
      ) : coffees.length === 0 ? (
        <p>No coffees added yet. Be the first!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {coffees.map((coffee) => (
            <li
              key={coffee.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <strong>{coffee.name}</strong> ({coffee.roast})
                {coffee.origin && <div style={{ fontSize: "0.85em", color: "#666" }}>Origin: {coffee.origin}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <span style={{ fontSize: "1.2em", fontWeight: "bold" }}>{coffee.votes} ⭐</span>
                <button
                  onClick={() => handleVote(coffee.id)}
                  style={{
                    padding: "6px 12px",
                    cursor: "pointer",
                    background: "#008CBA",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  +1 Vote
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}