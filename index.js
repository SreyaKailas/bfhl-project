const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Helper: Validate edge
function isValidEdge(edge) {
  if (!edge) return false;
  edge = edge.trim();
  const regex = /^[A-Z]->[A-Z]$/;
  if (!regex.test(edge)) return false;

  const [p, c] = edge.split("->");
  if (p === c) return false;

  return true;
}

app.post("/bfhl", (req, res) => {
  const { data } = req.body;

  let validEdges = [];
  let invalidEntries = [];
  let duplicateEdges = [];

  const seen = new Set();

  // Step 1: Validate + duplicates
  for (let edge of data) {
    edge = edge.trim();

    if (!isValidEdge(edge)) {
      invalidEntries.push(edge);
      continue;
    }

    if (seen.has(edge)) {
      if (!duplicateEdges.includes(edge)) {
        duplicateEdges.push(edge);
      }
      continue;
    }

    seen.add(edge);
    validEdges.push(edge);
  }

  // Step 2: Build graph
  let graph = {};
  let childSet = new Set();

  for (let edge of validEdges) {
    const [parent, child] = edge.split("->");

    if (!graph[parent]) graph[parent] = {};
    graph[parent][child] = {};

    childSet.add(child);
  }

  // Step 3: Find roots
  let nodes = new Set();
  validEdges.forEach(e => {
    const [p, c] = e.split("->");
    nodes.add(p);
    nodes.add(c);
  });

  let roots = [...nodes].filter(n => !childSet.has(n));

  if (roots.length === 0 && nodes.size > 0) {
    roots = [ [...nodes].sort()[0] ];
  }

  // Step 4: DFS + depth + cycle detection
  let visited = new Set();

  function dfs(node, path) {
    if (path.has(node)) return { cycle: true };

    path.add(node);

    let depth = 1;
    let tree = {};

    if (graph[node]) {
      for (let child in graph[node]) {
        const result = dfs(child, new Set(path));
        if (result.cycle) return { cycle: true };

        tree[child] = result.tree;
        depth = Math.max(depth, 1 + result.depth);
      }
    }

    return { tree, depth };
  }

  let hierarchies = [];
  let totalTrees = 0;
  let totalCycles = 0;
  let maxDepth = 0;
  let largestRoot = "";

  for (let root of roots) {
    const result = dfs(root, new Set());

    if (result.cycle) {
      totalCycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    } else {
      totalTrees++;
      hierarchies.push({
        root,
        tree: { [root]: result.tree },
        depth: result.depth
      });

      if (
        result.depth > maxDepth ||
        (result.depth === maxDepth && root < largestRoot)
      ) {
        maxDepth = result.depth;
        largestRoot = root;
      }
    }
  }

  res.json({
    user_id: "sreyakailas_24062005",
    email_id: "sk0997@srmist.edu.in",
    college_roll_number: "RA2311003020600",
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestRoot
    }
  });
});

app.get("/", (req, res) => {
  res.send("BFHL API Running ");
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));