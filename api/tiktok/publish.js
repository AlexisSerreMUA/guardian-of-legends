// api/tiktok/publish.js
// Publie un carrousel DÉJÀ généré (images statiques servies par ce même site)
// sur le compte TikTok connecté. N'appelle jamais Claude ni fal.ai : c'est
// uniquement une démonstration de l'intégration Content Posting API, sans coût
// de génération IA, exploitable par n'importe quel visiteur sans risque.

function parseCookies(req) {
  const header = req.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .filter(Boolean)
      .map(c => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
  )
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' })
    return
  }

  const { tiktok_token: accessToken } = parseCookies(req)
  if (!accessToken) {
    res.status(401).json({ error: 'Non connecté. Clique d\'abord sur "Connecter TikTok".' })
    return
  }

  // Remplace ces noms de fichiers par ceux que tu déposes dans /public/demo/
  const BASE_URL = 'https://guardian-of-legends-fp8r.vercel.app'
  const demoImages = [
    `${BASE_URL}/demo/slide_0.jpg`,
    `${BASE_URL}/demo/slide_1.jpg`,
    `${BASE_URL}/demo/slide_2.jpg`,
    `${BASE_URL}/demo/slide_3.jpg`,
    `${BASE_URL}/demo/slide_4.jpg`,
  ]

  try {
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        post_info: {
          description: 'Démo Guardian of Legends ⚔️ #ia #histoire',
          privacy_level: 'SELF_ONLY', // sandbox non audité : publication privée uniquement
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          is_ai_generated: true,
          auto_add_music: true,
          photo_cover_index: 0,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: demoImages,
          photo_cover_index: 0,
        },
        post_mode: 'MEDIA_UPLOAD',
        media_type: 'PHOTO',
      }),
    })

    const data = await initRes.json()

    if (!data.data?.publish_id) {
      res.status(400).json({ error: 'Publication échouée', details: data })
      return
    }

    res.status(200).json({ success: true, publish_id: data.data.publish_id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
