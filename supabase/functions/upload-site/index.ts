import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { unzipSync } from "https://esm.sh/fflate@0.8.1"

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
const REPO_OWNER = 'scottymker'
const REPO_NAME = 'Preview-Portal'
const BRANCH = 'main'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubTreeItem {
  path: string
  mode: string
  type: string
  sha?: string
  content?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token not configured')
    }

    // Parse multipart form data
    const formData = await req.formData()
    const zipFile = formData.get('file') as File
    const siteName = formData.get('siteName') as string

    if (!zipFile || !siteName) {
      throw new Error('Missing file or siteName')
    }

    // Validate site name (alphanumeric, hyphens, underscores only)
    const cleanSiteName = siteName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!/^[a-z0-9_-]+$/.test(cleanSiteName)) {
      throw new Error('Invalid site name. Use only letters, numbers, hyphens, and underscores.')
    }

    console.log(`Processing upload for site: ${cleanSiteName}`)
    console.log(`ZIP file size: ${zipFile.size} bytes`)

    // Read and extract ZIP file
    const zipData = await zipFile.arrayBuffer()
    console.log(`ArrayBuffer size: ${zipData.byteLength} bytes`)

    // Use fflate to unzip
    const unzipped = unzipSync(new Uint8Array(zipData))

    // Log all entries in the ZIP
    console.log('ZIP entries:')
    const allPaths: string[] = []
    for (const path of Object.keys(unzipped)) {
      console.log(`  - ${path}`)
      // Skip directories (end with /) and macOS metadata files
      if (!path.endsWith('/') && !path.startsWith('__MACOSX') && !path.includes('.DS_Store')) {
        allPaths.push(path)
      }
    }

    console.log(`Found ${allPaths.length} files in ZIP`)

    // Detect if all files share a common root folder
    let commonRoot = ''
    if (allPaths.length > 0) {
      const firstParts = allPaths[0].split('/')
      if (firstParts.length > 1) {
        const potentialRoot = firstParts[0]
        const allShareRoot = allPaths.every(p => p.startsWith(potentialRoot + '/'))
        if (allShareRoot) {
          commonRoot = potentialRoot + '/'
        }
      }
    }

    console.log(`Common root detected: "${commonRoot}"`)

    // Collect all files
    const files: { path: string; content: string }[] = []

    for (const [relativePath, data] of Object.entries(unzipped)) {
      // Skip directories and macOS metadata files
      if (relativePath.endsWith('/') || relativePath.startsWith('__MACOSX') || relativePath.includes('.DS_Store')) {
        continue
      }

      // Convert Uint8Array to base64
      const base64 = btoa(String.fromCharCode(...(data as Uint8Array)))

      // Strip common root folder if present
      let cleanPath = relativePath
      if (commonRoot && relativePath.startsWith(commonRoot)) {
        cleanPath = relativePath.slice(commonRoot.length)
      }

      if (cleanPath && cleanPath.length > 0) {
        files.push({
          path: `public/sites/${cleanSiteName}/${cleanPath}`,
          content: base64
        })
        console.log(`Added file: ${cleanPath}`)
      }
    }

    if (files.length === 0) {
      throw new Error('No valid files found in ZIP')
    }

    console.log(`Found ${files.length} files to upload`)

    // Verify GitHub token has write access
    console.log('Testing GitHub API access...')
    console.log(`Token prefix: ${GITHUB_TOKEN?.substring(0, 10)}...`)

    // GitHub API: Get the current commit SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Preview-Portal-Upload'
        }
      }
    )

    if (!refResponse.ok) {
      const error = await refResponse.text()
      throw new Error(`Failed to get branch ref: ${error}`)
    }

    console.log('GitHub ref fetch successful')

    const refData = await refResponse.json()
    const latestCommitSha = refData.object.sha

    // Get the current commit's tree
    const commitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Preview-Portal-Upload'
        }
      }
    )

    if (!commitResponse.ok) {
      throw new Error('Failed to get commit')
    }

    const commitData = await commitResponse.json()
    const baseTreeSha = commitData.tree.sha

    // Create blobs for each file
    const treeItems: GitHubTreeItem[] = []

    for (const file of files) {
      // Create blob
      const blobResponse = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'Preview-Portal-Upload'
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'base64'
          })
        }
      )

      if (!blobResponse.ok) {
        const error = await blobResponse.text()
        console.error(`Failed to create blob for ${file.path}:`, error)
        throw new Error(`GitHub blob error: ${error}`)
      }

      const blobData = await blobResponse.json()

      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      })
    }

    if (treeItems.length === 0) {
      throw new Error('Failed to create any file blobs')
    }

    // Create a new tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Preview-Portal-Upload'
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      }
    )

    if (!treeResponse.ok) {
      const error = await treeResponse.text()
      throw new Error(`Failed to create tree: ${error}`)
    }

    const treeData = await treeResponse.json()

    // Create a new commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Preview-Portal-Upload'
        },
        body: JSON.stringify({
          message: `Deploy site: ${cleanSiteName}`,
          tree: treeData.sha,
          parents: [latestCommitSha]
        })
      }
    )

    if (!newCommitResponse.ok) {
      const error = await newCommitResponse.text()
      throw new Error(`Failed to create commit: ${error}`)
    }

    const newCommitData = await newCommitResponse.json()

    // Update the branch reference
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Preview-Portal-Upload'
        },
        body: JSON.stringify({
          sha: newCommitData.sha
        })
      }
    )

    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.text()
      throw new Error(`Failed to update branch: ${error}`)
    }

    const previewUrl = `https://preview.thedevside.com/sites/${cleanSiteName}/`

    console.log(`Successfully deployed ${files.length} files to ${cleanSiteName}`)

    return new Response(
      JSON.stringify({
        success: true,
        siteName: cleanSiteName,
        previewUrl,
        filesUploaded: treeItems.length,
        commitSha: newCommitData.sha
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
