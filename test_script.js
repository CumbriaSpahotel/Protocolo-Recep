                    window.setChannelHotelFilter = function(val) {
                        document.getElementById('channel-hotel-filter').value = val;
                        
                        document.querySelectorAll('.hotel-filter-btn').forEach(btn => {
                            if (btn.getAttribute('data-hotel') === val) {
                                btn.style.background = '#0ea5e9';
                                btn.style.color = 'white';
                                btn.style.border = 'none';
                                btn.style.boxShadow = '0 4px 10px rgba(14, 165, 233, 0.2)';
                            } else {
                                btn.style.background = '#f8fafc';
                                btn.style.color = '#64748b';
                                btn.style.border = '1px solid #e2e8f0';
                                btn.style.boxShadow = 'none';
                            }
                        });
                        
                        filterChannelsGrid();
                    };

                    window.filterChannelsGrid = function() {
                        const searchInput = document.getElementById('channel-search');
                        const hotelFilter = document.getElementById('channel-hotel-filter');
                        
                        const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
                        const h = hotelFilter ? hotelFilter.value : 'all';
                        
                        const cards = document.querySelectorAll('.channel-card-mini');
                        const detailView = document.getElementById('channel-detail-view');
                        
                        if (detailView.style.display === 'block') {
                            hideChannelDetail();
                        }

                        cards.forEach(card => {
                            const name = card.getAttribute('data-name');
                            const hotel = card.getAttribute('data-hotel');
                            
                            const matchName = name.includes(q);
                            const matchHotel = h === 'all' || hotel === h || hotel === 'Ambos hoteles';
                            
                            card.style.display = (matchName && matchHotel) ? 'flex' : 'none';
                        });
                    };

                    window.showChannelDetail = function(id) {
                        const grid = document.getElementById('channels-grid-view');
                        const detail = document.getElementById('channel-detail-view');
                        const content = document.getElementById('channel-detail-content');
                        
                        // Find data in global config
                        const config = typeof channels_config !== 'undefined' ? channels_config.find(c => c.id === id) : null;
                        if (!config) return;

                        // Prepare HTML Content intelligently
                        let safeHtmlContent = '';
                        if (config.htmlContent) {
                            if (config.htmlContent.toLowerCase().includes('<!doctype html>') || config.htmlContent.toLowerCase().includes('<html')) {
                                let escaped = config.htmlContent;
                                
                                // HACK: Remove the dark full-screen body from the pasted HTML so it blends perfectly
                                escaped = escaped.replace(/<body[^>]*>/i, '<body style="margin:0; padding:0; background: transparent; font-family: \'Outfit\', sans-serif;">');
                                escaped = escaped.replace(/class="print-card[^"]*"/i, 'class="" style="width: 100%; border: none; box-shadow: none; background: transparent;"');
                                
                                // Auto-resize script to make it seamless
                                const resizeScript = \`
                                &lt;script&gt;
                                    function sendHeight() {
                                        window.parent.postMessage({ type: 'resize-iframe', id: '\${config.id}', height: document.documentElement.scrollHeight }, '*');
                                    }
                                    window.addEventListener('load', sendHeight);
                                    window.addEventListener('resize', sendHeight);
                                    new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true });
                                &lt;/script&gt;
                                </body>
                                \`;
                                escaped = escaped.replace(new RegExp('</body>', 'i'), resizeScript);
                                escaped = escaped.replace(/"/g, '&quot;');
                                
                                safeHtmlContent = '<div class="channel-custom-html" style="margin-top:30px;"><iframe id="iframe-' + config.id + '" srcdoc="' + escaped + '" style="width:100%; height:1000px; border:none; background: transparent; overflow: hidden;" scrolling="no"></iframe></div>';
                            } else {
                                safeHtmlContent = '<div class="channel-custom-html" style="margin-top:30px; border-top: 1px solid #f1f5f9; padding-top: 30px;">' + config.htmlContent + '</div>';
                            }
                        }

                        // Render detail content
                        content.innerHTML = \`
                            <div class="channel-pane animate-in" style="animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px;">
                                    <h2 style="border:none; margin:0; color: #0f172a; font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 15px; letter-spacing: -0.5px;">
                                        <span style="background: #f1f5f9; width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">\${config.icon}</span>
                                        \${config.name}
                                        \${config.isGift ? '<span style="background: #f3e8ff; color: #7e22ce; padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; border: 1px solid #e9d5ff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Bono Regalo</span>' : ''}
                                    </h2>
                                </div>
                                <div class="channel-card" style="background: white; border-radius: 20px; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px rgba(0,0,0,0.03); position: relative; overflow: hidden;">
                                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #0369a1, #fbbf24);"></div>
                                    <h3 style="margin-top:0; color: #0f172a; font-size: 1.4rem; font-weight: 800; margin-bottom: 20px;">\${config.summary || 'Resumen Operativo'}</h3>
                                    <div style="color: #334155; line-height: 1.8; font-size: 1rem; font-weight: 500;">
                                        \${config.content ? '<p>' + config.content.replace(/\\n/g, '<br>') + '</p>' : ''}
                                    </div>
                                    \${safeHtmlContent}
                                    \${config.notes ? \`
                                        <div style="margin-top:35px; padding:25px; background: #fffcf0; border-left: 6px solid #fbbf24; border-radius: 16px;">
                                            <h4 style="margin:0 0 12px 0; font-size:0.8rem; color:#854d0e; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900; display: flex; align-items: center; gap: 8px;"><i class="fas fa-lightbulb"></i> Notas de Importancia</h4>
                                            <p style="margin:0; font-size:0.95rem; color: #713f12; font-style:italic; line-height: 1.6;">\${config.notes.replace(/\\n/g, '<br>')}</p>
                                        </div>
                                    \` : ''}
                                    \${config.errors ? \`
                                        <div style="margin-top:25px; padding:25px; background: #fff2f2; border-left: 6px solid #ef4444; border-radius: 16px;">
                                            <h4 style="margin:0 0 12px 0; font-size:0.8rem; color:#b91c1c; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900; display: flex; align-items: center; gap: 8px;"><i class="fas fa-exclamation-triangle"></i> Errores Frecuentes</h4>
                                            <p style="margin:0; font-size:0.95rem; color: #7f1d1d; font-style:italic; line-height: 1.6;">\${config.errors.replace(/\\n/g, '<br>')}</p>
                                        </div>
                                    \` : ''}
                                </div>
                            </div>
                        \`;

                        grid.style.display = 'none';
                        detail.style.display = 'block';
                        window.scrollTo({ top: document.querySelector('.channel-explorer-container').offsetTop - 20, behavior: 'smooth' });
                    };

                    window.hideChannelDetail = function() {
                        document.getElementById('channels-grid-view').style.display = 'grid';
                        document.getElementById('channel-detail-view').style.display = 'none';
                    };
