// api/tiktok/callback.js
// Reçoit le "code" renvoyé par TikTok après autorisation, l'échange contre un
// access token (côté serveur, donc le client_secret ne fuite jamais dans le
// navigateur), puis stocke le token dans un cookie httpOnly et redirige
// l'utilisateur vers une page de confirmation.

module.exports = async (req, res) => {
  const { code, error, error_description } = req.query

  if (error) {
    res.status(400).send(`Autorisation refusée : ${error_description || error}`)
    return
  }
  if (!code) {
    res.status(400).send('Code manquant dans la redirection TikTok.')
    return
  }

  const CLIENT_KEY = process.env.TIKTOK_SANDBOX_CLIENT_KEY
  const CLIENT_SECRET = process.env.TIKTOK_SANDBOX_CLIENT_SECRET
  const REDIRECT_URI = 'https://guardian-of-legends-fp8r.vercel.app/api/tiktok/callback'

  if (!CLIENT_KEY || !CLIENT_SECRET) {
    res.status(500).send('Variables TIKTOK_SANDBOX_CLIENT_KEY / TIKTOK_SANDBOX_CLIENT_SECRET manquantes sur Vercel.')
    return
  }

  try {
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })
    const data = await tokenRes.json()

    if (!data.access_token) {
      res.status(400).send(`Échange du token échoué : ${JSON.stringify(data)}`)
      return
    }

    // Cookie httpOnly : invisible en JS côté navigateur, envoyé automatiquement
    // par le navigateur à chaque appel vers /api/tiktok/publish.
    res.setHeader(
      'Set-Cookie',
      `tiktok_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    )

    res.writeHead(302, { Location: '/connected.html' })
    res.end()
  } catch (err) {
    res.status(500).send('Erreur serveur : ' + err.message)
  }
}
